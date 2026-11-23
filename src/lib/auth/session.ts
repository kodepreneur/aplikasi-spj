import { cookies } from "next/headers";
import { eq, and, gt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accounts, sessions, type Account } from "@/lib/db/schema";
import { generateToken, sha256 } from "./crypto";
import { getAppConfig } from "@/lib/config";

const COOKIE_NAME = "bapenda_session";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60; // 8 hours

export interface SessionContext {
  user: Account;
  csrf: string;
  tokenHash: string;
}

/**
 * Creates a new session in database and sets the HttpOnly cookie.
 */
export async function createSession(userId: string): Promise<{ rawToken: string; csrf: string }> {
  const db = getDb();
  const rawToken = generateToken(32);
  const csrf = generateToken(32);
  const tokenHash = sha256(rawToken);
  const now = Date.now();
  const expires = now + SESSION_LIFETIME_SECONDS * 1000;

  // Clean up expired sessions periodically
  await db.delete(sessions).where(sql`${sessions.expires} <= ${now}`);

  // Insert session
  await db.insert(sessions).values({
    tokenHash,
    userId,
    csrf,
    expires,
  });

  // Set cookie
  const config = getAppConfig();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.isSecure,
    maxAge: SESSION_LIFETIME_SECONDS,
    path: "/",
  });

  return { rawToken, csrf };
}

/**
 * Retrieves the currently authenticated session and user.
 */
export async function getSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieVal) return null;

  const tokenHash = sha256(cookieVal);
  const now = Date.now();
  const db = getDb();

  const record = await db
    .select({
      session: sessions,
      user: accounts,
    })
    .from(sessions)
    .innerJoin(accounts, eq(sessions.userId, accounts.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expires, now),
        eq(accounts.active, 1),
        sql`${accounts.deletedAt} IS NULL`
      )
    )
    .get();

  if (!record) {
    return null;
  }

  return {
    user: record.user,
    csrf: record.session.csrf,
    tokenHash: record.session.tokenHash,
  };
}

/**
 * Destroy current session and clear cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieVal) {
    const tokenHash = sha256(cookieVal);
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  cookieStore.delete(COOKIE_NAME);
}

/**
 * Revoke all active sessions for a specific user (e.g. on password change or account deactivation).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Enforce that the request is authenticated, or redirect / throw.
 */
export async function requireAuth(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Enforce that the request is from an admin user.
 */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
