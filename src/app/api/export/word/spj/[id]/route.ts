import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { generateSpjDocx } from "@/lib/exporters/word-spj";
import { checkSourceStatus } from "@/lib/domain/link-mapper";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const { id } = await props.params;
  const db = getDb();

  const doc = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.app, "spj"),
        eq(documents.id, id),
        sql`${documents.deletedAt} IS NULL`
      )
    )
    .get();

  if (!doc) {
    return NextResponse.json(
      { error: "Dokumen SPJ tidak ditemukan atau telah dihapus." },
      { status: 404 }
    );
  }

  let payload: any = {};
  try {
    payload = JSON.parse(doc.payload);
  } catch {
    return NextResponse.json(
      { error: "Format berkas SPJ rusak atau tidak valid." },
      { status: 500 }
    );
  }

  // Check if linked to contract source
  let linkSnapshot: any = null;
  if (doc.linkJson) {
    try {
      linkSnapshot = JSON.parse(doc.linkJson);
    } catch {}
  }

  if (linkSnapshot && linkSnapshot.id) {
    const latestContract = await db
      .select()
      .from(documents)
      .where(and(eq(documents.app, "kontrak"), eq(documents.id, linkSnapshot.id)))
      .get();

    const status = checkSourceStatus(linkSnapshot, latestContract);
    if (status === "changed") {
      return NextResponse.json(
        {
          error:
            "Kontrak sumber telah diperbarui. Harap buka formulir SPJ dan tekan 'Perbarui dari kontrak' sebelum mengunduh Word.",
          code: "source-stale",
        },
        { status: 409 }
      );
    }
  }

  try {
    const docxBuffer = await generateSpjDocx(payload.values || {}, payload.items || []);

    const safeTitle = (payload.values?.pekerjaan || "spj")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50);

    // Record export timestamp in database
    await db
      .update(documents)
      .set({ exportedAt: new Date().toISOString() })
      .where(eq(documents.id, id));

    return new NextResponse(docxBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="spj-${safeTitle}.docx"`,
        "Content-Length": String(docxBuffer.byteLength),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal menghasilkan berkas Word SPJ." },
      { status: 500 }
    );
  }
}
