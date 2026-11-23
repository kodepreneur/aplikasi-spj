"use server";

import { revalidatePath } from "next/cache";
import { count, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents, events, accounts } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import {
  importArchiveData,
  detectArchiveFormat,
  type ImportResult,
} from "@/lib/domain/legacy-import";

export async function parseArchiveFileAction(content: string): Promise<{
  success: boolean;
  app?: "kontrak" | "spj";
  format?: string;
  version?: number;
  recordCount?: number;
  message?: string;
}> {
  await requireAuth();

  try {
    const parsed = JSON.parse(content);
    const detected = detectArchiveFormat(parsed);
    if (!detected) {
      return {
        success: false,
        message:
          "Format arsip tidak dikenali. Pastikan berkas berasal dari ekspor 'SPJ_REKAP_OFFLINE' atau 'BAPENDA_KONTRAK_ARSIP_OFFLINE'.",
      };
    }

    return {
      success: true,
      app: detected.app,
      format: detected.format,
      version: detected.version,
      recordCount: detected.recordCount,
    };
  } catch {
    return {
      success: false,
      message: "Berkas bukan format JSON yang valid.",
    };
  }
}

export async function executeImportArchiveAction(
  app: "kontrak" | "spj",
  content: string
): Promise<ImportResult> {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    throw new Error("Hanya Administrator yang memiliki wewenang untuk mengimpor arsip.");
  }

  try {
    const parsed = JSON.parse(content);
    const result = await importArchiveData(
      app,
      { id: session.user.id, username: session.user.username },
      parsed
    );

    revalidatePath("/kontrak");
    revalidatePath("/spj");
    revalidatePath("/");
    revalidatePath("/admin/migrasi");

    return result;
  } catch (err: any) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      conflicts: [],
      message: err?.message || "Gagal mengimpor arsip dokumen.",
    };
  }
}

export async function getMigrationStatsAction(): Promise<{
  contractCount: number;
  spjCount: number;
  eventCount: number;
  legacyCount: number;
}> {
  await requireAuth();
  const db = getDb();

  const [contractRes, spjRes, eventRes, legacyRes] = await Promise.all([
    db
      .select({ count: count() })
      .from(documents)
      .where(sql`${documents.app} = 'kontrak' AND ${documents.deletedAt} IS NULL`)
      .get(),
    db
      .select({ count: count() })
      .from(documents)
      .where(sql`${documents.app} = 'spj' AND ${documents.deletedAt} IS NULL`)
      .get(),
    db
      .select({ count: count() })
      .from(events)
      .get(),
    db
      .select({ count: count() })
      .from(events)
      .where(eq(events.legacy, 1))
      .get(),
  ]);

  return {
    contractCount: contractRes?.count || 0,
    spjCount: spjRes?.count || 0,
    eventCount: eventRes?.count || 0,
    legacyCount: legacyRes?.count || 0,
  };
}
