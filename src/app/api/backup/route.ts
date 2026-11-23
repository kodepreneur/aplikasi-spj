import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { documents, events, accounts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya Administrator yang dapat mengunduh cadangan sistem." },
      { status: 403 }
    );
  }

  const db = getDb();

  const [allAccounts, allDocs, allEvents] = await Promise.all([
    db
      .select({
        id: accounts.id,
        username: accounts.username,
        loginKey: accounts.loginKey,
        role: accounts.role,
        active: accounts.active,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(sql`${accounts.deletedAt} IS NULL`)
      .all(),
    db
      .select()
      .from(documents)
      .where(sql`${documents.deletedAt} IS NULL`)
      .all(),
    db.select().from(events).all(),
  ]);

  const backupData = {
    version: 3,
    exportedAt: new Date().toISOString(),
    exportedBy: session.user.username,
    statistics: {
      accountsCount: allAccounts.length,
      documentsCount: allDocs.length,
      eventsCount: allEvents.length,
    },
    accounts: allAccounts,
    documents: allDocs.map((doc) => ({
      ...doc,
      payload: (() => {
        try {
          return JSON.parse(doc.payload);
        } catch {
          return doc.payload;
        }
      })(),
      linkJson: (() => {
        try {
          return doc.linkJson ? JSON.parse(doc.linkJson) : null;
        } catch {
          return doc.linkJson;
        }
      })(),
    })),
    events: allEvents,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(jsonStr, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="bapenda-arsip-cadangan-${dateStr}.json"`,
    },
  });
}
