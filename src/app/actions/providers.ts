"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, sql, desc, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { providers, type Provider } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";

export interface ProviderInput {
  id?: string;
  name: string;
  type: "CV" | "PT" | "UD" | "Koperasi" | "Perorangan";
  director?: string;
  address?: string;
  npwp?: string;
  phone?: string;
  position?: string;
  paymentPosition?: string;
  bankName?: string;
  bankAccount?: string;
}

export async function getProvidersAction(search?: string): Promise<Provider[]> {
  await requireAuth();
  const db = getDb();

  let query = db
    .select()
    .from(providers)
    .where(sql`${providers.deletedAt} IS NULL`)
    .orderBy(providers.name);

  const rows = await query.all();

  if (!search || !search.trim()) {
    return rows;
  }

  const s = search.toLowerCase().trim();
  return rows.filter(
    (p) =>
      p.name.toLowerCase().includes(s) ||
      (p.director && p.director.toLowerCase().includes(s)) ||
      (p.npwp && p.npwp.toLowerCase().includes(s)) ||
      (p.address && p.address.toLowerCase().includes(s)) ||
      (p.bankAccount && p.bankAccount.toLowerCase().includes(s))
  );
}

export async function saveProviderAction(
  input: ProviderInput
): Promise<{ success: boolean; message: string; provider?: Provider }> {
  await requireAuth();
  const db = getDb();

  const trimmedName = (input.name || "").trim().toUpperCase();
  if (!trimmedName) {
    return { success: false, message: "Nama perusahaan / rekanan wajib diisi." };
  }

  const now = new Date().toISOString();

  // If ID exists, update
  if (input.id) {
    const existing = await db
      .select()
      .from(providers)
      .where(and(eq(providers.id, input.id), sql`${providers.deletedAt} IS NULL`))
      .get();

    if (!existing) {
      return { success: false, message: "Data penyedia tidak ditemukan." };
    }

    await db
      .update(providers)
      .set({
        name: trimmedName,
        type: input.type || "CV",
        director: (input.director || "").trim().toUpperCase(),
        address: (input.address || "").trim(),
        npwp: (input.npwp || "").trim(),
        phone: (input.phone || "").trim(),
        position: (input.position || "DIREKTUR").trim().toUpperCase(),
        paymentPosition: (input.paymentPosition || "DIREKTUR").trim().toUpperCase(),
        bankName: (input.bankName || "Bank Jatim").trim(),
        bankAccount: (input.bankAccount || "").trim(),
        updatedAt: now,
      })
      .where(eq(providers.id, input.id));

    const updated = await db.select().from(providers).where(eq(providers.id, input.id)).get();
    revalidatePath("/master/penyedia");
    revalidatePath("/kontrak");
    revalidatePath("/spj");
    return { success: true, message: "Data penyedia berhasil diperbarui.", provider: updated };
  }

  // Check duplicate by name and type
  const duplicate = await db
    .select()
    .from(providers)
    .where(
      and(
        eq(providers.name, trimmedName),
        eq(providers.type, input.type || "CV"),
        sql`${providers.deletedAt} IS NULL`
      )
    )
    .get();

  if (duplicate) {
    // If exact name and type already exists, update and return it
    await db
      .update(providers)
      .set({
        director: (input.director || duplicate.director || "").trim().toUpperCase(),
        address: (input.address || duplicate.address || "").trim(),
        npwp: (input.npwp || duplicate.npwp || "").trim(),
        phone: (input.phone || duplicate.phone || "").trim(),
        position: (input.position || duplicate.position || "DIREKTUR").trim().toUpperCase(),
        paymentPosition: (input.paymentPosition || duplicate.paymentPosition || "DIREKTUR").trim().toUpperCase(),
        bankName: (input.bankName || duplicate.bankName || "Bank Jatim").trim(),
        bankAccount: (input.bankAccount || duplicate.bankAccount || "").trim(),
        updatedAt: now,
      })
      .where(eq(providers.id, duplicate.id));

    const updated = await db.select().from(providers).where(eq(providers.id, duplicate.id)).get();
    revalidatePath("/master/penyedia");
    return { success: true, message: "Data penyedia berhasil diperbarui.", provider: updated };
  }

  // Insert new
  const newId = randomUUID();
  await db.insert(providers).values({
    id: newId,
    name: trimmedName,
    type: input.type || "CV",
    director: (input.director || "").trim().toUpperCase(),
    address: (input.address || "").trim(),
    npwp: (input.npwp || "").trim(),
    phone: (input.phone || "").trim(),
    position: (input.position || "DIREKTUR").trim().toUpperCase(),
    paymentPosition: (input.paymentPosition || "DIREKTUR").trim().toUpperCase(),
    bankName: (input.bankName || "Bank Jatim").trim(),
    bankAccount: (input.bankAccount || "").trim(),
    active: 1,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(providers).where(eq(providers.id, newId)).get();
  revalidatePath("/master/penyedia");
  revalidatePath("/kontrak");
  revalidatePath("/spj");
  return { success: true, message: "Penyedia baru berhasil ditambahkan ke Master Data.", provider: created };
}

export async function deleteProviderAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  await requireAuth();
  const db = getDb();

  const now = new Date().toISOString();
  await db
    .update(providers)
    .set({ deletedAt: now, active: 0 })
    .where(eq(providers.id, id));

  revalidatePath("/master/penyedia");
  return { success: true, message: "Penyedia berhasil dihapus dari Master Data." };
}

export async function seedSampleProvidersAction(): Promise<{ success: boolean; message: string; count: number }> {
  await requireAuth();
  const db = getDb();

  const samples: ProviderInput[] = [
    {
      name: "LUNA SENTOSA GEMILANG INDONESIA",
      type: "CV",
      director: "LUSI ANGGRAENI SEMBIRING",
      address: "JALAN SUMATRA NOMOR 82B, JEMBER",
      npwp: "71.746.501.7-626.000",
      phone: "081234567890",
      position: "DIREKTUR",
      paymentPosition: "DIREKTUR",
      bankName: "Bank Jatim",
      bankAccount: "0031019575",
    },
    {
      name: "GLOBALTECH USAHA SEJAHTERA",
      type: "PT",
      director: "HADI MARTA DWINATA",
      address: "ISTANA KALIWATES RESIDENCE C26 MANGLI - KALIWATES, JEMBER",
      npwp: "1000.0000.0328.1156",
      phone: "082198765432",
      position: "DIREKTUR UTAMA",
      paymentPosition: "DIREKTUR UTAMA",
      bankName: "Bank Jatim",
      bankAccount: "0032048192",
    },
    {
      name: "GRAHA MEDIA CIPTA JEMBER",
      type: "CV",
      director: "BAMBANG SUDARMONO",
      address: "JL. GAJAH MADA NO. 145, KALIWATES, JEMBER",
      npwp: "02.345.678.9-626.000",
      phone: "0331-487652",
      position: "DIREKTUR",
      paymentPosition: "DIREKTUR",
      bankName: "Bank Jatim Cabang Jember",
      bankAccount: "0031024567",
    },
    {
      name: "KARYA PERDANA TEKNOLOGI",
      type: "CV",
      director: "ANDI SETIAWAN, S.T.",
      address: "JL. KALIMANTAN NO. 33, SUMBERSARI, JEMBER",
      npwp: "84.123.456.7-626.000",
      phone: "085230123456",
      position: "DIREKTUR",
      paymentPosition: "DIREKTUR",
      bankName: "Bank Jatim",
      bankAccount: "0031098765",
    },
    {
      name: "SURYA MANDIRI SEJAHTERA",
      type: "UD",
      director: "AHMAD SYARIFUDDIN",
      address: "JL. PB SUDIRMAN NO. 12, PATRANG, JEMBER",
      npwp: "09.876.543.2-626.000",
      phone: "081333444555",
      position: "PEMILIK",
      paymentPosition: "PEMILIK",
      bankName: "Bank Jatim",
      bankAccount: "0031054321",
    },
  ];

  let added = 0;
  for (const s of samples) {
    const existing = await db
      .select()
      .from(providers)
      .where(and(eq(providers.name, s.name), sql`${providers.deletedAt} IS NULL`))
      .get();

    if (!existing) {
      await saveProviderAction(s);
      added++;
    }
  }

  revalidatePath("/master/penyedia");
  return { success: true, message: `Berhasil menambahkan ${added} data rekanan contoh.`, count: added };
}
