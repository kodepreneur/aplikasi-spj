import { randomUUID } from "node:crypto";
import { getDb } from "./index";
import { accounts } from "./schema";
import { hashPassword } from "../auth/crypto";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();
  console.log("Checking admin existence...");
  
  const existingAdmin = await db
    .select()
    .from(accounts)
    .where(eq(accounts.role, "admin"))
    .get();

  if (existingAdmin) {
    console.log(`Admin account '${existingAdmin.username}' already exists. Skipping seed.`);
    return;
  }

  const defaultUsername = "Sendy";
  const defaultPassword = "Sendyganteng";
  const passwordHash = await hashPassword(defaultPassword);
  const now = new Date().toISOString();

  await db.insert(accounts).values({
    id: randomUUID(),
    username: defaultUsername,
    loginKey: defaultUsername.toLowerCase(),
    role: "admin",
    passwordHash,
    active: 1,
    createdAt: now,
    themeUnified: "mario",
  });

  console.log("==================================================");
  console.log("Admin account successfully created!");
  console.log(`Username : ${defaultUsername}`);
  console.log(`Password : ${defaultPassword}`);
  console.log("Please change this password after your first login.");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
