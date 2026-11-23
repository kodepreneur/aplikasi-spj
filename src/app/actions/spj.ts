"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents, events, type Document, type Event } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { getSpjTemplate } from "@/lib/domain/spj-template";
import {
  computeSpj,
  calculateSpending,
  type SpjItemInput,
  type SpjCalculationResult,
} from "@/lib/domain/tax-calc";
import {
  checkSourceStatus,
  mapContractToSpj,
  matchesSnapshot,
  type SpjSourceSnapshot,
  type SourceStatus,
} from "@/lib/domain/link-mapper";

export interface SpjSummary {
  id: string;
  title: string;
  providerName: string;
  spkNumber: string;
  total: number;
  net: number;
  ownerId: string;
  ownerName: string;
  revision: number;
  isExported: boolean;
  isLinked: boolean;
  sourceStatus: SourceStatus;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SpjDetail {
  document: Document;
  payload: {
    values: Record<string, string>;
    items: SpjItemInput[];
  };
  calculations: SpjCalculationResult;
  linkSnapshot: SpjSourceSnapshot | null;
  sourceStatus: SourceStatus;
  events: Event[];
  canEdit: boolean;
  canDelete: boolean;
}

export interface SaveSpjResult {
  success: boolean;
  id?: string;
  revision?: number;
  message: string;
  conflict?: boolean;
  currentRevision?: number;
  errors?: string[];
}

export async function listSpjAction(filters?: {
  query?: string;
  year?: string;
  ownerId?: string;
}): Promise<SpjSummary[]> {
  const session = await requireAuth();
  const db = getDb();

  const conditions = [
    eq(documents.app, "spj"),
    sql`${documents.deletedAt} IS NULL`,
  ];

  if (filters?.ownerId) {
    conditions.push(eq(documents.ownerId, filters.ownerId));
  }

  const rows = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt), desc(documents.rowNo))
    .all();

  const searchQuery = filters?.query?.toLowerCase().trim();
  const template = getSpjTemplate();
  const summaries: SpjSummary[] = [];

  for (const doc of rows) {
    let payload: any = {};
    try {
      payload = JSON.parse(doc.payload);
    } catch {
      payload = {};
    }

    const values = payload.values || {};
    const items = payload.items || [];
    const title = values.pekerjaan || "Tanpa Judul Belanja";
    const providerName = [values.bentuk_usaha, values.nama_penyedia].filter(Boolean).join(" ") || "-";
    const spkNumber = values.nomor_sp || "-";

    if (filters?.year && values.tahun_anggaran !== filters.year) {
      continue;
    }

    if (searchQuery) {
      const matchTitle = title.toLowerCase().includes(searchQuery);
      const matchProvider = providerName.toLowerCase().includes(searchQuery);
      const matchSpk = spkNumber.toLowerCase().includes(searchQuery);
      const matchOwner = doc.ownerName.toLowerCase().includes(searchQuery);
      if (!matchTitle && !matchProvider && !matchSpk && !matchOwner) {
        continue;
      }
    }

    let total = 0;
    let net = 0;
    try {
      const calc = computeSpj(values, items, template.fields);
      total = calc.spending.total || 0;
      net = calc.net || 0;
    } catch {
      total = 0;
      net = 0;
    }

    let linkSnapshot: SpjSourceSnapshot | null = null;
    let sourceStatus: SourceStatus = "none";

    if (doc.linkJson) {
      try {
        linkSnapshot = JSON.parse(doc.linkJson);
        if (linkSnapshot && linkSnapshot.id) {
          const contractDoc = await db
            .select()
            .from(documents)
            .where(and(eq(documents.app, "kontrak"), eq(documents.id, linkSnapshot.id)))
            .get();
          sourceStatus = checkSourceStatus(linkSnapshot, contractDoc);
        }
      } catch {}
    }

    const canEdit = session.user.role === "admin" || doc.ownerId === session.user.id;
    const canDelete = session.user.role === "admin" || doc.ownerId === session.user.id;

    summaries.push({
      id: doc.id,
      title,
      providerName,
      spkNumber,
      total,
      net,
      ownerId: doc.ownerId,
      ownerName: doc.ownerName,
      revision: doc.revision,
      isExported: Boolean(doc.exportedAt),
      isLinked: Boolean(linkSnapshot),
      sourceStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      canEdit,
      canDelete,
    });
  }

  return summaries;
}

export async function getSpjAction(id: string): Promise<SpjDetail | null> {
  const session = await requireAuth();
  const db = getDb();

  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), sql`${documents.deletedAt} IS NULL`))
    .get();

  if (!doc) return null;

  let payload: any = {};
  try {
    payload = JSON.parse(doc.payload);
  } catch {
    throw new Error("Format berkas SPJ rusak atau tidak valid.");
  }

  const template = getSpjTemplate();
  const calculations = computeSpj(payload.values || {}, payload.items || [], template.fields);

  let linkSnapshot: SpjSourceSnapshot | null = null;
  let sourceStatus: SourceStatus = "none";

  if (doc.linkJson) {
    try {
      linkSnapshot = JSON.parse(doc.linkJson);
      if (linkSnapshot && linkSnapshot.id) {
        const contractDoc = await db
          .select()
          .from(documents)
          .where(and(eq(documents.app, "kontrak"), eq(documents.id, linkSnapshot.id)))
          .get();
        sourceStatus = checkSourceStatus(linkSnapshot, contractDoc);
      }
    } catch {}
  }

  const docEvents = await db
    .select()
    .from(events)
    .where(eq(events.documentId, id))
    .orderBy(events.seq)
    .all();

  const canEdit = session.user.role === "admin" || doc.ownerId === session.user.id;
  const canDelete = session.user.role === "admin" || doc.ownerId === session.user.id;

  return {
    document: doc,
    payload: {
      values: payload.values || {},
      items: payload.items || [],
    },
    calculations,
    linkSnapshot,
    sourceStatus,
    events: docEvents,
    canEdit,
    canDelete,
  };
}

export async function saveSpjAction(data: {
  id?: string | null;
  payload: {
    values: Record<string, any>;
    items: SpjItemInput[];
  };
  linkJson?: SpjSourceSnapshot | null;
  expectedRevision?: number;
  creationKey?: string;
}): Promise<SaveSpjResult> {
  const session = await requireAuth();
  const db = getDb();
  const template = getSpjTemplate();

  const calculations = computeSpj(
    data.payload.values,
    data.payload.items,
    template.fields
  );

  if (calculations.errors.length > 0) {
    return {
      success: false,
      message: "Terdapat kesalahan pengisian formulir SPJ.",
      errors: calculations.errors,
    };
  }

  // If linked, check snapshot match
  if (data.linkJson && data.linkJson.id) {
    const isMatched = matchesSnapshot(
      data.payload.values,
      data.payload.items,
      data.linkJson
    );
    if (!isMatched) {
      return {
        success: false,
        message:
          "RAB dan identitas tertaut harus mengikuti kontrak sumber. Gunakan tombol 'Perbarui dari kontrak' untuk memperbarui perubahan.",
      };
    }
  }

  const now = new Date().toISOString();
  const payloadStr = JSON.stringify(data.payload);
  const linkJsonStr = data.linkJson ? JSON.stringify(data.linkJson) : null;
  const sourceKey = data.linkJson?.id ? `kontrak:${data.linkJson.id}` : null;

  // CASE 1: UPDATE EXISTING SPJ
  if (data.id) {
    const existing = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, data.id), sql`${documents.deletedAt} IS NULL`))
      .get();

    if (!existing) {
      return {
        success: false,
        message: "Dokumen SPJ tidak ditemukan atau telah dihapus.",
      };
    }

    const canEdit = session.user.role === "admin" || existing.ownerId === session.user.id;
    if (!canEdit) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengubah dokumen SPJ ini.",
      };
    }

    // OCC Check
    if (
      data.expectedRevision !== undefined &&
      data.expectedRevision !== null &&
      existing.revision !== data.expectedRevision
    ) {
      return {
        success: false,
        conflict: true,
        currentRevision: existing.revision,
        message: `Konflik revisi: Dokumen telah diperbarui oleh pengguna lain (revisi saat ini: ${existing.revision}, draf Anda: ${data.expectedRevision}). Cadangkan draf Anda sebelum memuat ulang.`,
      };
    }

    const newRevision = existing.revision + 1;

    await db
      .update(documents)
      .set({
        payload: payloadStr,
        linkJson: linkJsonStr,
        sourceKey: sourceKey,
        revision: newRevision,
        updatedAt: now,
      })
      .where(eq(documents.id, data.id));

    await db.insert(events).values({
      documentId: data.id,
      action: "edited",
      at: now,
      actorId: session.user.id,
      actorName: session.user.username,
      legacy: 0,
    });

    revalidatePath("/spj");
    revalidatePath(`/spj/${data.id}`);
    revalidatePath(`/spj/${data.id}/edit`);

    return {
      success: true,
      id: data.id,
      revision: newRevision,
      message: "Dokumen SPJ berhasil disimpan.",
    };
  }

  // CASE 2: CREATE NEW SPJ
  if (data.creationKey) {
    const existingByKey = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.app, "spj"),
          eq(documents.ownerId, session.user.id),
          eq(documents.creationKey, data.creationKey),
          sql`${documents.deletedAt} IS NULL`
        )
      )
      .get();

    if (existingByKey) {
      return {
        success: true,
        id: existingByKey.id,
        revision: existingByKey.revision,
        message: "Dokumen SPJ telah dibuat sebelumnya.",
      };
    }
  }

  const newId = randomUUID();

  await db.insert(documents).values({
    id: newId,
    app: "spj",
    ownerId: session.user.id,
    ownerName: session.user.username,
    creationKey: data.creationKey || null,
    sourceKey: sourceKey,
    linkJson: linkJsonStr,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    payload: payloadStr,
  });

  await db.insert(events).values({
    documentId: newId,
    action: "created",
    at: now,
    actorId: session.user.id,
    actorName: session.user.username,
    legacy: 0,
  });

  revalidatePath("/spj");

  return {
    success: true,
    id: newId,
    revision: 1,
    message: "Dokumen SPJ baru berhasil dibuat.",
  };
}

export async function syncSpjFromContractAction(
  spjId: string
): Promise<{ success: boolean; message: string; updatedData?: any }> {
  const session = await requireAuth();
  const db = getDb();

  const spjDoc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, spjId), sql`${documents.deletedAt} IS NULL`))
    .get();

  if (!spjDoc) {
    throw new Error("Dokumen SPJ tidak ditemukan.");
  }

  const canEdit = session.user.role === "admin" || spjDoc.ownerId === session.user.id;
  if (!canEdit) {
    throw new Error("Anda tidak memiliki hak akses untuk memperbarui SPJ ini.");
  }

  if (!spjDoc.linkJson) {
    throw new Error("SPJ ini tidak tertaut ke kontrak manapun.");
  }

  const snapshot: SpjSourceSnapshot = JSON.parse(spjDoc.linkJson);
  const contractDoc = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.app, "kontrak"),
        eq(documents.id, snapshot.id),
        sql`${documents.deletedAt} IS NULL`
      )
    )
    .get();

  if (!contractDoc) {
    throw new Error("Kontrak sumber telah dihapus. Pembaruan dibatalkan.");
  }

  const contractPayload = JSON.parse(contractDoc.payload);
  const mapped = mapContractToSpj(contractDoc, contractPayload);

  // Merge fresh mapped values with existing non-linked fields in SPJ
  const currentPayload = JSON.parse(spjDoc.payload);
  const mergedValues = {
    ...currentPayload.values,
    ...mapped.values,
  };

  const newPayload = {
    values: mergedValues,
    items: mapped.items,
  };

  const now = new Date().toISOString();
  const newRevision = spjDoc.revision + 1;

  await db
    .update(documents)
    .set({
      payload: JSON.stringify(newPayload),
      linkJson: JSON.stringify(mapped.source),
      revision: newRevision,
      updatedAt: now,
    })
    .where(eq(documents.id, spjId));

  await db.insert(events).values({
    documentId: spjId,
    action: "edited",
    at: now,
    actorId: session.user.id,
    actorName: session.user.username,
    legacy: 0,
  });

  revalidatePath("/spj");
  revalidatePath(`/spj/${spjId}`);
  revalidatePath(`/spj/${spjId}/edit`);

  return {
    success: true,
    message: "Data SPJ berhasil diperbarui dari kontrak sumber.",
    updatedData: newPayload,
  };
}

export async function deleteSpjAction(
  id: string,
  expectedRevision?: number
): Promise<{ success: boolean; message: string; conflict?: boolean }> {
  const session = await requireAuth();
  const db = getDb();

  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), sql`${documents.deletedAt} IS NULL`))
    .get();

  if (!existing) {
    return {
      success: false,
      message: "Dokumen SPJ tidak ditemukan atau telah dihapus.",
    };
  }

  const canDelete = session.user.role === "admin" || existing.ownerId === session.user.id;
  if (!canDelete) {
    return {
      success: false,
      message: "Anda tidak memiliki wewenang untuk menghapus SPJ ini.",
    };
  }

  if (
    expectedRevision !== undefined &&
    expectedRevision !== null &&
    existing.revision !== expectedRevision
  ) {
    return {
      success: false,
      conflict: true,
      message: `Konflik revisi: Dokumen ini telah diperbarui menjadi revisi ${existing.revision}. Harap muat ulang terlebih dahulu.`,
    };
  }

  const now = new Date().toISOString();

  await db
    .update(documents)
    .set({
      deletedAt: now,
      revision: existing.revision + 1,
      updatedAt: now,
    })
    .where(eq(documents.id, id));

  await db.insert(events).values({
    documentId: id,
    action: "deleted",
    at: now,
    actorId: session.user.id,
    actorName: session.user.username,
    legacy: 0,
  });

  revalidatePath("/spj");

  return {
    success: true,
    message: "Dokumen SPJ berhasil dihapus.",
  };
}

export async function listContractsForSpjAction(): Promise<
  {
    id: string;
    packageName: string;
    providerName: string;
    spkNumber: string;
    budget: string;
    revision: number;
    createdAt: string;
  }[]
> {
  await requireAuth();
  const db = getDb();

  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.app, "kontrak"), sql`${documents.deletedAt} IS NULL`))
    .orderBy(desc(documents.updatedAt))
    .all();

  const list = [];
  for (const doc of rows) {
    let payload: any = {};
    try {
      payload = JSON.parse(doc.payload);
    } catch {
      continue;
    }
    list.push({
      id: doc.id,
      packageName: payload.packageName || "Tanpa Nama Paket",
      providerName: [payload.providerType, payload.providerName].filter(Boolean).join(" "),
      spkNumber: payload.spkNumber || "-",
      budget: payload.budget || "0",
      revision: doc.revision,
      createdAt: doc.createdAt,
    });
  }

  return list;
}
