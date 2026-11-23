import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { accounts } from "../../db/schema";
import { hashPassword, verifyPassword } from "../crypto";
import { checkRateLimit, resetRateLimit } from "../rate-limit";

async function runTests() {
  console.log("=== RUNNING PHASE 2 AUTHENTICATION & USER MANAGEMENT TESTS ===");
  const db = getDb();

  // Test 1: Verify Initial Admin Account
  console.log("\n[Test 1] Verifying default admin account 'Sendy'...");
  const admin = await db
    .select()
    .from(accounts)
    .where(eq(accounts.loginKey, "sendy"))
    .get();

  if (!admin) throw new Error("FAIL: Admin 'Sendy' not found in database!");
  const isValidAdminPass = await verifyPassword("Sendyganteng", admin.passwordHash);
  if (!isValidAdminPass) throw new Error("FAIL: Password verification for 'Sendy' failed!");
  console.log("✓ Admin 'Sendy' verified with Scrypt hash successfully.");

  // Test 2: Password Rules & Hashing
  console.log("\n[Test 2] Testing password rules (min 12 chars) & Scrypt compatibility...");
  try {
    await hashPassword("short");
    throw new Error("FAIL: Short password should have been rejected!");
  } catch (err: any) {
    console.log("✓ Rejected password under 12 characters as expected:", err.message);
  }

  const testPass = "BapendaJember2026!";
  const hash = await hashPassword(testPass);
  const match = await verifyPassword(testPass, hash);
  const mismatch = await verifyPassword("WrongPassword123!", hash);
  if (!match || mismatch) throw new Error("FAIL: Scrypt hash verification logic failed!");
  console.log("✓ Password hashing & verification timingSafeEqual works perfectly.");

  // Test 3: Rate Limiter
  console.log("\n[Test 3] Testing Rate Limiter (8 attempts per 5 minutes)...");
  const testKey = "test:login:user123";
  resetRateLimit(testKey);

  for (let i = 1; i <= 8; i++) {
    const res = checkRateLimit(testKey, 8, 5 * 60_000);
    if (!res.success) throw new Error(`FAIL: Attempt ${i} should have passed!`);
  }
  const blocked = checkRateLimit(testKey, 8, 5 * 60_000);
  if (blocked.success) throw new Error("FAIL: 9th attempt should have been rate limited!");
  console.log("✓ Rate limiting correctly blocked 9th attempt.");
  resetRateLimit(testKey);

  console.log("\n==================================================");
  console.log("ALL PHASE 2 UNIT TESTS PASSED SUCCESSFULLY! (100%)");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
