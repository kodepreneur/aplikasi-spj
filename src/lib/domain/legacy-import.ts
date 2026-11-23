import { createHash, randomUUID } from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents, events, accounts, type Document } from "@/lib/db/schema";
import { calculateContract } from "./contract-calc";
import { computeSpj } from "./tax-calc";
import { getSpjTemplate } from "./spj-template";

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  conflicts: string[];
  message: string;
}

const spjIdRegex = /^spj-[a-f0-9]{32}$/i;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const legacyIdRegex = /^legacy-[a-z0-9._-]{3,40}$/i;

function parseIsoDate(val: any): string {
  if (typeof val !== "string" || !val.trim() || !Number.isFinite(Date.parse(val))) {
    return new Date().toISOString();
  }
  return new Date(val).toISOString();
}

function cleanUsername(val: any): string {
  if (typeof val !== "string") return "legacy-user";
  const cleaned = val.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return cleaned || "legacy-user";
}

export function detectArchiveFormat(rawJson: any): {
  app: "kontrak" | "spj";
  format: string;
  version: number;
  recordCount: number;
} | null {
  if (!rawJson || typeof rawJson !== "object") return null;

  if (
    rawJson.format === "SPJ_REKAP_OFFLINE" &&
    Array.isArray(rawJson.records)
  ) {
    return {
      app: "spj",
      format: "SPJ_REKAP_OFFLINE",
      version: Number(rawJson.version) || 1,
      recordCount: rawJson.records.length,
    };
  }

  if (
    rawJson.format === "BAPENDA_KONTRAK_ARSIP_OFFLINE" &&
    Array.isArray(rawJson.records)
  ) {
    return {
      app: "kontrak",
      format: "BAPENDA_KONTRAK_ARSIP_OFFLINE",
      version: Number(rawJson.version) || 1,
      recordCount: rawJson.records.length,
    };
  }

  // Auto-detect array of documents
  if (Array.isArray(rawJson)) {
    if (rawJson.length > 0 && rawJson[0]?.packageName !== undefined) {
      return {
        app: "kontrak",
        format: "BAPENDA_KONTRAK_RAW",
        version: 1,
        recordCount: rawJson.length,
      };
    }
    if (rawJson.length > 0 && rawJson[0]?.values?.pekerjaan !== undefined) {
      return {
        app: "spj",
        format: "SPJ_REKAP_RAW",
        version: 1,
        recordCount: rawJson.length,
      };
    }
  }

  return null;
}

export async function importArchiveData(
  app: "kontrak" | "spj",
  actor: { id: string; username: string },
  input: any
): Promise<ImportResult> {
  const db = getDb();

  let records: any[] = [];
  if (Array.isArray(input)) {
    records = input;
  } else if (input && Array.isArray(input.records)) {
    records = input.records;
  } else {
    throw new Error(
      "Format berkas tidak valid. Berkas harus berupa objek arsip JSON dengan daftar rekaman dokumen."
    );
  }

  if (records.length === 0) {
    return {
      success: true,
      imported: 0,
      skipped: 0,
      conflicts: [],
      message: "Tidak ada rekaman dokumen yang ditemukan dalam berkas arsip.",
    };
  }

  if (records.length > 3000) {
    throw new Error(
      `Jumlah rekaman (${records.length}) melebihi batas maksimal 3.000 dokumen per pengunggahan.`
    );
  }

  // Load all accounts to resolve owner
  const allAccounts = await db.select().from(accounts).all();
  const accountByUsername = new Map<string, typeof accounts.$inferSelect>();
  for (const acc of allAccounts) {
    accountByUsername.set(acc.username.toLowerCase(), acc);
    accountByUsername.set(acc.loginKey.toLowerCase(), acc);
  }

  const totals = { imported: 0, skipped: 0, conflicts: [] as string[] };
  const now = new Date().toISOString();

  for (const entry of records) {
    if (!entry) continue;

    let sourceKey: string = "";
    let payloadObj: any = null;
    let ownerName: string = actor.username;
    let ownerId: string = actor.id;
    let createdAt = now;
    let updatedAt = now;
    let exportedAt: string | null = null;
    let historyEdits: { name: string; at: string }[] = [];

    if (app === "spj") {
      sourceKey = entry.id || `spj-${randomUUID().replace(/-/g, "")}`;
      ownerName = cleanUsername(entry.ownerName || entry.owner || actor.username);
      createdAt = parseIsoDate(entry.createdAt);
      updatedAt = parseIsoDate(entry.updatedAt);
      if (entry.status === "exported" || entry.isExported) {
        exportedAt = parseIsoDate(entry.lastExportedAt || entry.exportedAt || updatedAt);
      }

      if (Array.isArray(entry.history)) {
        historyEdits = entry.history.map((h: any) => ({
          name: cleanUsername(h?.actorName || h?.name),
          at: parseIsoDate(h?.at),
        }));
      }

      // Structure SPJ payload: { values, items }
      if (entry.values && entry.items) {
        payloadObj = {
          values: entry.values,
          items: entry.items,
        };
      } else if (entry.data?.values && entry.data?.items) {
        payloadObj = entry.data;
      } else {
        // Fallback for flat SPJ structure
        payloadObj = {
          values: entry.values || entry,
          items: entry.items || [],
        };
      }
    } else {
      // Kontrak manual
      sourceKey = entry.id || randomUUID();
      ownerName = cleanUsername(entry.owner?.name || entry.ownerName || actor.username);
      createdAt = parseIsoDate(entry.createdAt);
      updatedAt = parseIsoDate(entry.updatedAt);

      if (Array.isArray(entry.events)) {
        historyEdits = entry.events
          .filter((e: any) => e?.kind === "edited" || e?.action === "edited")
          .map((e: any) => ({
            name: cleanUsername(e?.by?.name || e?.actorName),
            at: parseIsoDate(e?.at),
          }));
      }

      payloadObj = entry.data || entry.payload || entry;
    }

    // Resolve owner account or fallback to importing actor
    const matchedAccount = accountByUsername.get(ownerName.toLowerCase());
    if (matchedAccount) {
      ownerId = matchedAccount.id;
      ownerName = matchedAccount.username;
    } else {
      ownerId = actor.id;
      ownerName = actor.username;
    }

    const payloadJsonStr = JSON.stringify(payloadObj);
    const sourceHash = createHash("sha256")
      .update(JSON.stringify({ sourceKey, payload: payloadObj }))
      .digest("hex");

    // Check if duplicate or conflict exists
    const existing = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.app, app),
          eq(documents.sourceKey, sourceKey),
          sql`${documents.deletedAt} IS NULL`
        )
      )
      .get();

    if (existing) {
      if (existing.sourceHash === sourceHash) {
        totals.skipped++;
      } else {
        totals.conflicts.push(sourceKey);
      }
      continue;
    }

    const newDocId = randomUUID();

    await db.insert(documents).values({
      id: newDocId,
      app,
      ownerId,
      ownerName,
      sourceKey,
      sourceHash,
      revision: 1,
      payload: payloadJsonStr,
      linkJson: entry.linkJson ? JSON.stringify(entry.linkJson) : null,
      createdAt,
      updatedAt,
      exportedAt,
    });

    // Record creation event
    await db.insert(events).values({
      documentId: newDocId,
      action: "created",
      at: createdAt,
      actorId: ownerId,
      actorName: ownerName,
      legacy: 1,
    });

    // Record historical edits
    for (const edit of historyEdits.sort((a, b) => a.at.localeCompare(b.at))) {
      const editAccount = accountByUsername.get(edit.name.toLowerCase());
      await db.insert(events).values({
        documentId: newDocId,
        action: "edited",
        at: edit.at,
        actorId: editAccount?.id || null,
        actorName: edit.name,
        legacy: 1,
      });
    }

    // Record imported event
    await db.insert(events).values({
      documentId: newDocId,
      action: "imported",
      at: now,
      actorId: actor.id,
      actorName: actor.username,
      legacy: 0,
    });

    totals.imported++;
  }

  return {
    success: true,
    imported: totals.imported,
    skipped: totals.skipped,
    conflicts: totals.conflicts,
    message: `Berhasil mengimpor ${totals.imported} dokumen, ${totals.skipped} dilewati (identik), ${totals.conflicts.length} konflik.`,
  };
}
