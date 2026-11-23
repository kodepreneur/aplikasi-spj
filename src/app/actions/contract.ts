"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents, events, type Document, type Event } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { contractPayloadSchema, type ContractPayloadInput } from "@/lib/validations/contract";
import {
  calculateContract,
  summarizeCalculation,
  type FormattedContractSummary,
} from "@/lib/domain/contract-calc";

export interface ContractSummary {
  id: string;
  packageName: string;
  providerName: string;
  budget: string;
  finalTotal: string;
  ownerId: string;
  ownerName: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ContractDetail {
  document: Document;
  payload: ContractPayloadInput;
  calculations: FormattedContractSummary;
  events: Event[];
  canEdit: boolean;
  canDelete: boolean;
}

export interface SaveContractResult {
  success: boolean;
  id?: string;
  revision?: number;
  message: string;
  conflict?: boolean;
  currentRevision?: number;
  errors?: Record<string, string[]>;
}

export async function listContractsAction(filters?: {
  query?: string;
  ownerId?: string;
}): Promise<ContractSummary[]> {
  const session = await requireAuth();
  const db = getDb();

  const conditions = [
    eq(documents.app, "kontrak"),
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

  const summaries: ContractSummary[] = [];

  for (const doc of rows) {
    let payload: any = {};
    try {
      payload = JSON.parse(doc.payload);
    } catch {
      payload = {};
    }

    const packageName = payload.packageName || "Tanpa Nama Paket";
    const providerName = [payload.providerType, payload.providerName].filter(Boolean).join(" ") || "-";
    const budget = payload.budget || "0";

    // Text search filter if provided
    if (searchQuery) {
      const matchPackage = packageName.toLowerCase().includes(searchQuery);
      const matchProvider = providerName.toLowerCase().includes(searchQuery);
      const matchOwner = doc.ownerName.toLowerCase().includes(searchQuery);
      if (!matchPackage && !matchProvider && !matchOwner) {
        continue;
      }
    }

    let finalTotal = "0";
    try {
      const calc = calculateContract(payload);
      finalTotal = summarizeCalculation(calc).finalTotal;
    } catch {
      finalTotal = "0";
    }

    const canEdit = session.user.role === "admin" || doc.ownerId === session.user.id;
    const canDelete = session.user.role === "admin" || doc.ownerId === session.user.id;

    summaries.push({
      id: doc.id,
      packageName,
      providerName,
      budget,
      finalTotal,
      ownerId: doc.ownerId,
      ownerName: doc.ownerName,
      revision: doc.revision,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      canEdit,
      canDelete,
    });
  }

  return summaries;
}

export async function getContractAction(id: string): Promise<ContractDetail | null> {
  const session = await requireAuth();
  const db = getDb();

  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), sql`${documents.deletedAt} IS NULL`))
    .get();

  if (!doc) {
    return null;
  }

  let payload: ContractPayloadInput;
  try {
    payload = JSON.parse(doc.payload);
  } catch (err) {
    throw new Error("Format berkas kontrak rusak atau tidak valid.");
  }

  const rawCalc = calculateContract(payload);
  const calculations = summarizeCalculation(rawCalc);

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
    payload,
    calculations,
    events: docEvents,
    canEdit,
    canDelete,
  };
}

export async function saveContractAction(data: {
  id?: string | null;
  payload: any;
  expectedRevision?: number;
  creationKey?: string;
}): Promise<SaveContractResult> {
  const session = await requireAuth();
  const db = getDb();

  const parseResult = contractPayloadSchema.safeParse(data.payload);
  if (!parseResult.success) {
    const errorMap = parseResult.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Terdapat kesalahan validasi pada formulir kontrak.",
      errors: errorMap as Record<string, string[]>,
    };
  }

  const validPayload = parseResult.data;

  // Validate calculations don't throw
  try {
    calculateContract(validPayload);
  } catch (calcError: any) {
    return {
      success: false,
      message: `Perhitungan RAB gagal: ${calcError?.message || "Format angka tidak valid"}`,
    };
  }

  const now = new Date().toISOString();

  // CASE 1: UPDATE EXISTING CONTRACT
  if (data.id) {
    const existing = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, data.id), sql`${documents.deletedAt} IS NULL`))
      .get();

    if (!existing) {
      return {
        success: false,
        message: "Dokumen kontrak tidak ditemukan atau telah dihapus.",
      };
    }

    const canEdit = session.user.role === "admin" || existing.ownerId === session.user.id;
    if (!canEdit) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengubah kontrak ini.",
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
        message: `Konflik revisi: Dokumen ini telah diperbarui oleh pengguna lain (revisi saat ini: ${existing.revision}, draf Anda: ${data.expectedRevision}). Silakan cadangkan isian lokal Anda sebelum memuat ulang.`,
      };
    }

    const newRevision = existing.revision + 1;

    await db
      .update(documents)
      .set({
        payload: JSON.stringify(validPayload),
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

    revalidatePath("/kontrak");
    revalidatePath(`/kontrak/${data.id}`);
    revalidatePath(`/kontrak/${data.id}/edit`);

    return {
      success: true,
      id: data.id,
      revision: newRevision,
      message: "Kontrak berhasil diperbarui.",
    };
  }

  // CASE 2: CREATE NEW CONTRACT
  if (data.creationKey) {
    const existingByKey = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.app, "kontrak"),
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
        message: "Kontrak telah disimpan sebelumnya.",
      };
    }
  }

  const newId = randomUUID();

  await db.insert(documents).values({
    id: newId,
    app: "kontrak",
    ownerId: session.user.id,
    ownerName: session.user.username,
    creationKey: data.creationKey || null,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    payload: JSON.stringify(validPayload),
  });

  await db.insert(events).values({
    documentId: newId,
    action: "created",
    at: now,
    actorId: session.user.id,
    actorName: session.user.username,
    legacy: 0,
  });

  revalidatePath("/kontrak");

  return {
    success: true,
    id: newId,
    revision: 1,
    message: "Kontrak baru berhasil dibuat.",
  };
}

export async function deleteContractAction(
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
      message: "Dokumen kontrak tidak ditemukan atau telah dihapus.",
    };
  }

  const canDelete = session.user.role === "admin" || existing.ownerId === session.user.id;
  if (!canDelete) {
    return {
      success: false,
      message: "Anda tidak memiliki wewenang untuk menghapus kontrak ini.",
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
      message: `Konflik revisi: Dokumen ini telah diperbarui menjadi revisi ${existing.revision}. Harap muat ulang terlebih dahulu sebelum menghapus.`,
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

  revalidatePath("/kontrak");

  return {
    success: true,
    message: "Kontrak berhasil dihapus.",
  };
}
