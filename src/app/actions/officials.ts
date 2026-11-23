"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, sql, desc, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { officials, type Official } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";

export interface OfficialInput {
  id?: string;
  name: string;
  nip?: string;
  pangkat?: string;
  role: "PA_PPK" | "PPTK" | "PEJABAT_PENGADAAN" | "BENDAHARA" | "PENGURUS_ASET" | "LAINNYA";
  positionTitle?: string;
  skNumber?: string;
  skDate?: string;
}

export async function getOfficialsAction(role?: string): Promise<Official[]> {
  await requireAuth();
  const db = getDb();

  let query = db
    .select()
    .from(officials)
    .where(sql`${officials.deletedAt} IS NULL`)
    .orderBy(officials.role, officials.name);

  const rows = await query.all();

  if (!role || role === "ALL") {
    return rows;
  }

  return rows.filter((o) => o.role === role);
}

export async function saveOfficialAction(
  input: OfficialInput
): Promise<{ success: boolean; message: string; official?: Official }> {
  await requireAuth();
  const db = getDb();

  const trimmedName = (input.name || "").trim().toUpperCase();
  if (!trimmedName) {
    return { success: false, message: "Nama lengkap pejabat wajib diisi." };
  }

  const now = new Date().toISOString();

  if (input.id) {
    const existing = await db
      .select()
      .from(officials)
      .where(and(eq(officials.id, input.id), sql`${officials.deletedAt} IS NULL`))
      .get();

    if (!existing) {
      return { success: false, message: "Data pejabat tidak ditemukan." };
    }

    await db
      .update(officials)
      .set({
        name: trimmedName,
        nip: (input.nip || "").trim(),
        pangkat: (input.pangkat || "").trim(),
        role: input.role || "PA_PPK",
        positionTitle: (input.positionTitle || "").trim(),
        skNumber: (input.skNumber || "").trim(),
        skDate: (input.skDate || "").trim(),
        updatedAt: now,
      })
      .where(eq(officials.id, input.id));

    const updated = await db.select().from(officials).where(eq(officials.id, input.id)).get();
    revalidatePath("/master/pejabat");
    revalidatePath("/kontrak");
    revalidatePath("/spj");
    return { success: true, message: "Data pejabat berhasil diperbarui.", official: updated };
  }

  const newId = randomUUID();
  await db.insert(officials).values({
    id: newId,
    name: trimmedName,
    nip: (input.nip || "").trim(),
    pangkat: (input.pangkat || "").trim(),
    role: input.role || "PA_PPK",
    positionTitle: (input.positionTitle || "").trim(),
    skNumber: (input.skNumber || "").trim(),
    skDate: (input.skDate || "").trim(),
    active: 1,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(officials).where(eq(officials.id, newId)).get();
  revalidatePath("/master/pejabat");
  revalidatePath("/kontrak");
  revalidatePath("/spj");
  return { success: true, message: "Pejabat baru berhasil ditambahkan ke Master Data.", official: created };
}

export async function deleteOfficialAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  await requireAuth();
  const db = getDb();

  const now = new Date().toISOString();
  await db
    .update(officials)
    .set({ deletedAt: now, active: 0 })
    .where(eq(officials.id, id));

  revalidatePath("/master/pejabat");
  return { success: true, message: "Pejabat berhasil dihapus dari Master Data." };
}

export async function seedSampleOfficialsAction(): Promise<{ success: boolean; message: string; count: number }> {
  await requireAuth();
  const db = getDb();

  const samples: OfficialInput[] = [
    {
      name: "HADI JAYA, S.Sos., M.Si.",
      nip: "19750101 200003 1 005",
      pangkat: "Pembina Tingkat I (IV/b)",
      role: "PA_PPK",
      positionTitle: "Kepala Badan / PPK",
      skNumber: "188.45/01/1.12/2026",
      skDate: "2026-01-02",
    },
    {
      name: "BUDI SANTOSO, S.E.",
      nip: "19820512 201001 1 012",
      pangkat: "Penata (III/c)",
      role: "PEJABAT_PENGADAAN",
      positionTitle: "Pejabat Pengadaan Barang/Jasa",
      skNumber: "188.45/04/1.12/2026",
      skDate: "2026-01-02",
    },
    {
      name: "AHMAD FAUZI, S.STP.",
      nip: "19800101 200501 1 002",
      pangkat: "Penata Tingkat I (III/d)",
      role: "PPTK",
      positionTitle: "Pejabat Pelaksana Teknis Kegiatan (PPTK)",
      skNumber: "188.45/02/1.12/2026",
      skDate: "2026-01-12",
    },
    {
      name: "SITI NURHALIZA, A.Md.",
      nip: "19830514 200902 2 004",
      pangkat: "Penata Muda (III/a)",
      role: "BENDAHARA",
      positionTitle: "Bendahara Pengeluaran",
      skNumber: "188.45/05/1.12/2026",
      skDate: "2026-01-02",
    },
    {
      name: "EKO PRASETYO, S.Kom.",
      nip: "19871102 201101 1 008",
      pangkat: "Penata Muda Tingkat I (III/b)",
      role: "PENGURUS_ASET",
      positionTitle: "Pengurus Barang Pengguna / Aset",
      skNumber: "188.45/03/1.12/2026",
      skDate: "2026-01-02",
    },
  ];

  let added = 0;
  for (const s of samples) {
    const existing = await db
      .select()
      .from(officials)
      .where(and(eq(officials.name, s.name), eq(officials.role, s.role), sql`${officials.deletedAt} IS NULL`))
      .get();

    if (!existing) {
      await saveOfficialAction(s);
      added++;
    }
  }

  revalidatePath("/master/pejabat");
  return { success: true, message: `Berhasil menambahkan ${added} data pejabat contoh.`, count: added };
}
