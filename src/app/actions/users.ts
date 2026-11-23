"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accounts, type Account } from "@/lib/db/schema";
import { requireAdmin, revokeAllUserSessions } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/crypto";
import { createUserSchema, resetPasswordSchema } from "@/lib/validations/auth";

export interface UserView {
  id: string;
  username: string;
  role: "admin" | "user";
  active: boolean;
  createdAt: string;
}

export async function getUsersAction(): Promise<UserView[]> {
  await requireAdmin();
  const db = getDb();

  const rows = await db
    .select({
      id: accounts.id,
      username: accounts.username,
      role: accounts.role,
      active: accounts.active,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .where(sql`${accounts.deletedAt} IS NULL`)
    .all();

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    role: r.role,
    active: Boolean(r.active),
    createdAt: r.createdAt,
  }));
}

export async function createUserAction(
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; user?: UserView }> {
  await requireAdmin();

  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role") || "user",
  };

  const parsed = createUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Format data akun tidak sesuai.",
    };
  }

  const { username, password, role } = parsed.data;
  const loginKey = username.toLowerCase();
  const db = getDb();

  // Check unique username
  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.loginKey, loginKey))
    .get();

  if (existing) {
    return {
      success: false,
      message: `Nama pengguna '${username}' sudah digunakan atau pernah tercatat dalam riwayat.`,
    };
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await db.insert(accounts).values({
    id,
    username,
    loginKey,
    role,
    passwordHash,
    active: 1,
    createdAt: now,
    themeUnified: "mario",
  });

  revalidatePath("/admin/akun");

  return {
    success: true,
    message: `Pengguna '${username}' berhasil ditambahkan.`,
    user: {
      id,
      username,
      role,
      active: true,
      createdAt: now,
    },
  };
}

export async function toggleUserActiveAction(
  userId: string,
  targetActiveState: boolean
): Promise<{ success: boolean; message: string }> {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    return {
      success: false,
      message: "Tidak dapat menonaktifkan akun admin yang sedang Anda gunakan.",
    };
  }

  const db = getDb();
  await db
    .update(accounts)
    .set({ active: targetActiveState ? 1 : 0 })
    .where(eq(accounts.id, userId));

  if (!targetActiveState) {
    await revokeAllUserSessions(userId);
  }

  revalidatePath("/admin/akun");

  return {
    success: true,
    message: `Status akun berhasil ${targetActiveState ? "diaktifkan" : "dinonaktifkan"}.`,
  };
}

export async function resetUserPasswordAction(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Kata sandi baru tidak memenuhi syarat.",
    };
  }

  const newHash = await hashPassword(parsed.data.password);
  const db = getDb();

  await db.update(accounts).set({ passwordHash: newHash }).where(eq(accounts.id, userId));
  await revokeAllUserSessions(userId);

  revalidatePath("/admin/akun");

  return {
    success: true,
    message: "Kata sandi akun pengguna berhasil direset.",
  };
}

export async function deleteUserAction(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    return {
      success: false,
      message: "Tidak dapat menghapus akun admin yang sedang digunakan.",
    };
  }

  const db = getDb();
  const now = new Date().toISOString();

  // Soft delete: clear credentials and mark inactive & deletedAt
  await db
    .update(accounts)
    .set({
      active: 0,
      deletedAt: now,
      passwordHash: null,
      photo: "",
      themeUnified: null,
      themeSpj: null,
      themeKontrak: null,
    })
    .where(eq(accounts.id, userId));

  await revokeAllUserSessions(userId);
  revalidatePath("/admin/akun");

  return {
    success: true,
    message: "Akun pengguna berhasil dihapus dari sistem.",
  };
}
