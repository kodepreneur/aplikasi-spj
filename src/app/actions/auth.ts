"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { verifyPassword, hashPassword, sha256 } from "@/lib/auth/crypto";
import { createSession, destroySession, getSession, requireAuth, revokeAllUserSessions } from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema, changePasswordSchema, profileUpdateSchema } from "@/lib/validations/auth";

export interface ActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
    });
    return {
      success: false,
      message: "Periksa kembali isian nama pengguna dan kata sandi.",
      fieldErrors,
    };
  }

  const { username, password } = parsed.data;
  const loginKey = username.toLowerCase();

  // Rate limit: 8 login attempts per 5 minutes per username
  const rateLimitKey = `login:${sha256(loginKey)}`;
  const rateCheck = checkRateLimit(rateLimitKey, 8, 5 * 60_000);
  if (!rateCheck.success) {
    const minutesLeft = Math.ceil((rateCheck.resetAt - Date.now()) / 60_000);
    return {
      success: false,
      message: `Terlalu banyak percobaan masuk yang salah. Silakan coba lagi dalam ${minutesLeft} menit.`,
    };
  }

  const db = getDb();
  const user = await db
    .select()
    .from(accounts)
    .where(eq(accounts.loginKey, loginKey))
    .get();

  if (!user || !user.active || user.deletedAt) {
    return {
      success: false,
      message: "Nama pengguna atau kata sandi salah, atau akun dinonaktifkan.",
    };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      message: "Nama pengguna atau kata sandi salah, atau akun dinonaktifkan.",
    };
  }

  // Login success -> reset rate limit and create session
  resetRateLimit(rateLimitKey);
  await createSession(user.id);

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();

  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = changePasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
    });
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Periksa kembali isian kata sandi.",
      fieldErrors,
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  // Rate limit password change attempts
  const rateCheck = checkRateLimit(`pwd:${session.user.id}`, 8, 5 * 60_000);
  if (!rateCheck.success) {
    return {
      success: false,
      message: "Terlalu banyak percobaan ganti kata sandi. Coba lagi dalam 5 menit.",
    };
  }

  const isCurrentValid = await verifyPassword(currentPassword, session.user.passwordHash);
  if (!isCurrentValid) {
    return {
      success: false,
      message: "Kata sandi saat ini belum benar.",
      fieldErrors: { currentPassword: "Kata sandi saat ini salah." },
    };
  }

  const db = getDb();
  const newHash = await hashPassword(newPassword);

  // Update password and revoke other sessions
  await db.update(accounts).set({ passwordHash: newHash }).where(eq(accounts.id, session.user.id));
  await revokeAllUserSessions(session.user.id);

  // Re-establish fresh session for the current user
  await createSession(session.user.id);

  return {
    success: true,
    message: "Kata sandi berhasil diperbarui.",
  };
}

export async function updateProfileAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();

  const rawData = {
    photo: formData.get("photo")?.toString(),
    themeUnified: formData.get("themeUnified")?.toString(),
  };

  const parsed = profileUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data profil tidak valid.",
    };
  }

  const db = getDb();
  const updates: Record<string, any> = {};
  if (parsed.data.photo !== undefined) updates.photo = parsed.data.photo;
  if (parsed.data.themeUnified !== undefined) updates.themeUnified = parsed.data.themeUnified;

  if (Object.keys(updates).length > 0) {
    await db.update(accounts).set(updates).where(eq(accounts.id, session.user.id));
  }

  return {
    success: true,
    message: "Profil berhasil diperbarui.",
  };
}
