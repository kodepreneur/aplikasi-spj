import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { generateSpjReportExcel, type SpjReportRecord } from "@/lib/exporters/excel-spj";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const ownerId = searchParams.get("ownerId");

  const db = getDb();

  const conditions = [
    eq(documents.app, "spj"),
    sql`${documents.deletedAt} IS NULL`,
  ];

  if (ownerId && session.user.role === "admin") {
    conditions.push(eq(documents.ownerId, ownerId));
  } else if (session.user.role !== "admin") {
    // Normal user only exports their own documents
    conditions.push(eq(documents.ownerId, session.user.id));
  }

  const rows = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt), desc(documents.rowNo))
    .all();

  const records: SpjReportRecord[] = [];

  for (const doc of rows) {
    let payload: any = {};
    try {
      payload = JSON.parse(doc.payload);
    } catch {
      continue;
    }

    const values = payload.values || {};
    if (year && values.tahun_anggaran !== year) {
      continue;
    }

    records.push({
      id: doc.id,
      values,
      items: payload.items || [],
    });
  }

  try {
    const excelBuffer = await generateSpjReportExcel(records);

    const safeYear = year || "semua";
    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rekap-spj-${safeYear}.xlsx"`,
        "Content-Length": String(excelBuffer.byteLength),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal menghasilkan berkas Excel Rekapitulasi SPJ." },
      { status: 500 }
    );
  }
}
