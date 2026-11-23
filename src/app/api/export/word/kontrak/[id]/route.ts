import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { generateWordContract } from "@/lib/exporters/word-contract";
import { tidy } from "@/lib/domain/contract-calc";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const db = getDb();
    const doc = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.app, "kontrak"),
          sql`${documents.deletedAt} IS NULL`
        )
      )
      .get();

    if (!doc) {
      return new NextResponse("Dokumen kontrak tidak ditemukan.", { status: 404 });
    }

    // Permission check
    if (session.user.role !== "admin" && doc.ownerId !== session.user.id) {
      return new NextResponse("Anda tidak memiliki izin mengunduh berkas ini.", { status: 403 });
    }

    const payload = JSON.parse(doc.payload);
    const wordBuffer = await generateWordContract(payload);

    const safeTitle = tidy(payload.packageName || "Kontrak")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const filename = `Kontrak_${safeTitle}_${payload.fiscalYear || "2026"}.docx`;

    return new NextResponse(Buffer.from(wordBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Error generating contract Word:", err);
    return new NextResponse(err.message || "Gagal membuat dokumen Word.", { status: 500 });
  }
}
