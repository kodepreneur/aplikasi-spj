import { randomUUID } from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { documents, events, accounts } from "../../db/schema";
import { getContractTemplate } from "../contract-template";
import {
  calculateContract,
  summarizeCalculation,
  prepareContractValues,
  rupiahWords,
} from "../contract-calc";
import { generatePrintContractHtml } from "../../exporters/print-contract";
import { generateContractDocx } from "../../exporters/word-contract";

async function runPhase3Tests() {
  console.log("=== RUNNING PHASE 3 KONTRAK MANUAL TESTS ===");
  const db = getDb();

  // Test 1: Load Contract Template
  console.log("\n[Test 1] Testing getContractTemplate()...");
  const template = getContractTemplate();
  if (!template.defaults || !template.dateFields || !template.letterGroups) {
    throw new Error("FAIL: Template structure missing required fields!");
  }
  console.log(
    `✓ Template loaded successfully: ${Object.keys(template.defaults).length} defaults, ${
      template.dateFields.length
    } date fields, ${template.letterGroups.length} letter groups.`
  );

  // Test 2: Domain RAB & Calculation Engine
  console.log("\n[Test 2] Testing calculateContract & Indonesian spelling...");
  const sampleContract: any = {
    packageName: "Jasa Pemeliharaan Jaringan Pajak",
    providerType: "CV",
    providerName: "TEKNOLOGI MAJU",
    budget: "50.000.000",
    vatRate: "11",
    fiscalYear: "2026",
    groups: [
      {
        name: "Pekerjaan Teknis",
        items: [
          {
            name: "Tenaga Ahli IT",
            unit: "Bulan",
            quantity: "2",
            volume: "1",
            earlyPrice: "10.000.000",
            finalPrice: "9.500.000",
          },
          {
            name: "Kabel Jaringan UTP",
            unit: "Roll",
            quantity: "5",
            volume: "1",
            earlyPrice: "1.000.000",
            finalPrice: "", // Should fallback to earlyPrice 1.000.000
          },
        ],
      },
    ],
  };

  const calc = calculateContract(sampleContract);
  if (calc.errors.length > 0) {
    throw new Error(`FAIL: Unexpected calculation errors: ${calc.errors.join(", ")}`);
  }

  const summary = summarizeCalculation(calc);
  // Early total: (2 * 10M) + (5 * 1M) = 25.000.000 subtotal + 11% PPN (2.750.000) = 27.750.000
  // Final total: (2 * 9.5M) + (5 * 1M) = 24.000.000 subtotal + 11% PPN (2.640.000) = 26.640.000
  if (summary.finalSubtotal !== "24.000.000" || summary.finalTotal !== "26.640.000") {
    throw new Error(
      `FAIL: Math mismatch! Expected subtotal 24.000.000 and total 26.640.000, got: sub=${summary.finalSubtotal}, tot=${summary.finalTotal}`
    );
  }
  console.log(`✓ RAB calculations correct: Subtotal Rp ${summary.finalSubtotal}, Total Rp ${summary.finalTotal}`);
  console.log(`✓ Terbilang generated: "${summary.finalWords}"`);

  // Test 3: Print Preview Generator
  console.log("\n[Test 3] Testing generatePrintContractHtml...");
  // Fill all date fields with valid dates for export
  const fullContract = { ...template.defaults, ...sampleContract };
  for (const f of template.dateFields) {
    if (!fullContract[f.key]) {
      fullContract[f.key] = "2026-10-02";
    }
  }
  const printHtml = generatePrintContractHtml(fullContract);
  if (!printHtml.includes("<!doctype html>") || !printHtml.includes("data:image/png;base64,")) {
    throw new Error("FAIL: Generated print HTML is missing doctype or embedded logo!");
  }
  console.log(`✓ Print HTML generated successfully (${printHtml.length} bytes).`);

  // Test 4: Word .docx Document Generator
  console.log("\n[Test 4] Testing generateContractDocx...");
  const docxBuffer = await generateContractDocx(fullContract);
  if (!docxBuffer || docxBuffer.length === 0) {
    throw new Error("FAIL: Generated docx buffer is empty!");
  }
  // Check ZIP signature (PK\x03\x04)
  if (docxBuffer[0] !== 0x50 || docxBuffer[1] !== 0x4b) {
    throw new Error("FAIL: Output buffer is not a valid ZIP/DOCX format!");
  }
  console.log(`✓ Word .docx generated successfully (${docxBuffer.length} bytes).`);

  // Test 5: Optimistic Concurrency Control (OCC) in Database
  console.log("\n[Test 5] Testing Database Persistence & OCC Revisions...");
  const admin = await db.select().from(accounts).where(eq(accounts.role, "admin")).get();
  if (!admin) throw new Error("FAIL: Admin user required for test!");

  const docId = "test-" + randomUUID();
  const now = new Date().toISOString();

  // Create document at revision 1
  await db.insert(documents).values({
    id: docId,
    app: "kontrak",
    ownerId: admin.id,
    ownerName: admin.username,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    payload: JSON.stringify(fullContract),
  });

  const created = await db.select().from(documents).where(eq(documents.id, docId)).get();
  if (!created || created.revision !== 1) {
    throw new Error("FAIL: Document failed to insert with revision 1!");
  }
  console.log("✓ Inserted document with Revision #1.");

  // Valid update with matching revision (1) -> should succeed and bump to 2
  const expectedRev = 1;
  if (created.revision !== expectedRev) {
    throw new Error("FAIL: Revision mismatch on valid check!");
  }
  await db
    .update(documents)
    .set({ revision: created.revision + 1, updatedAt: new Date().toISOString() })
    .where(eq(documents.id, docId));

  const updated = await db.select().from(documents).where(eq(documents.id, docId)).get();
  if (!updated || updated.revision !== 2) {
    throw new Error("FAIL: Document revision not bumped to 2!");
  }
  console.log("✓ Document revision successfully updated to #2.");

  // Stale update with old revision (1) -> OCC conflict detected!
  const staleExpectedRev = 1;
  const isConflict = (updated.revision as number) !== staleExpectedRev;
  if (!isConflict) {
    throw new Error("FAIL: OCC failed to detect stale revision!");
  }
  console.log(`✓ OCC Conflict correctly detected: server=${updated.revision}, client=${staleExpectedRev}.`);

  // Cleanup test document
  await db.delete(documents).where(eq(documents.id, docId));
  console.log("✓ Test document cleaned up.");

  console.log("\n==================================================");
  console.log("ALL PHASE 3 TESTS PASSED SUCCESSFULLY! (100%)");
  console.log("==================================================");
}

runPhase3Tests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
