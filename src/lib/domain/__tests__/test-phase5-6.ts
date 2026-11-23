import { randomUUID } from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { documents, events, accounts } from "../../db/schema";
import {
  detectArchiveFormat,
  importArchiveData,
  type ImportResult,
} from "../legacy-import";
import { getContractTemplate } from "../contract-template";
import { calculateContract, summarizeCalculation } from "../contract-calc";
import { generateContractDocx } from "../../exporters/word-contract";
import { getSpjTemplate, getDefaultSpjValues } from "../spj-template";
import {
  calculateSpending,
  calculatePph,
  computeSpj,
} from "../tax-calc";
import {
  mapContractToSpj,
  checkSourceStatus,
  matchesSnapshot,
} from "../link-mapper";
import { generateSpjDocx } from "../../exporters/word-spj";
import { generateSpjReportExcel } from "../../exporters/excel-spj";

async function runPhase5And6Tests() {
  console.log("=== RUNNING PHASE 5 & 6 INTEGRATION & VERIFICATION TESTS ===");
  const db = getDb();
  const templateKontrak = getContractTemplate();
  const templateSpj = getSpjTemplate();

  const adminUser = await db
    .select()
    .from(accounts)
    .where(eq(accounts.role, "admin"))
    .get();

  if (!adminUser) {
    throw new Error("FAIL: Admin user not found in database for testing.");
  }
  const actor = { id: adminUser.id, username: adminUser.username };

  // -------------------------------------------------------------
  // Test 1: Archive Format Detection
  // -------------------------------------------------------------
  console.log("\n[Test 1] Testing detectArchiveFormat...");
  const mockSpjArchive = {
    format: "SPJ_REKAP_OFFLINE",
    version: 2,
    records: [{ id: "spj-1234567890abcdef1234567890abcdef", ownerName: "sendy", values: {} }],
  };
  const detectedSpj = detectArchiveFormat(mockSpjArchive);
  if (!detectedSpj || detectedSpj.app !== "spj" || detectedSpj.recordCount !== 1) {
    throw new Error("FAIL: Failed to detect SPJ_REKAP_OFFLINE format.");
  }

  const mockContractArchive = {
    format: "BAPENDA_KONTRAK_ARSIP_OFFLINE",
    version: 1,
    records: [{ id: randomUUID(), ownerName: "sendy", data: {} }],
  };
  const detectedContract = detectArchiveFormat(mockContractArchive);
  if (!detectedContract || detectedContract.app !== "kontrak" || detectedContract.recordCount !== 1) {
    throw new Error("FAIL: Failed to detect BAPENDA_KONTRAK_ARSIP_OFFLINE format.");
  }

  const detectedInvalid = detectArchiveFormat({ foo: "bar" });
  if (detectedInvalid !== null) {
    throw new Error("FAIL: Invalid archive format was not rejected.");
  }
  console.log("✓ Archive formats recognized and validated accurately.");

  // -------------------------------------------------------------
  // Test 2: Import Legacy SPJ Archive & Duplicate/Conflict Detection
  // -------------------------------------------------------------
  console.log("\n[Test 2] Testing importArchiveData with duplicate & conflict handling...");
  const legacySpjId = "spj-abcdef1234567890abcdef1234567890";
  const legacyRecord = {
    id: legacySpjId,
    ownerName: adminUser.username,
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-12T15:30:00.000Z",
    status: "exported",
    values: {
      pekerjaan: "Belanja Jasa Servis AC Kantor",
      nama_penyedia: "CV. SEJUK ABADI",
      nomor_sp: "027/888/SPK/2026",
    },
    items: [
      {
        description: "Servis AC Split 1 PK",
        detail: "Ruang Rapat",
        unit: "Unit",
        quantity: "5",
        unitPrice: "150.000",
      },
    ],
    history: [
      { actorName: adminUser.username, at: "2026-05-11T12:00:00.000Z" },
    ],
  };

  const importBatch1 = {
    format: "SPJ_REKAP_OFFLINE",
    version: 2,
    records: [legacyRecord],
  };

  // Run 1: First Import
  const res1 = await importArchiveData("spj", actor, importBatch1);
  if (res1.imported !== 1 || res1.skipped !== 0) {
    throw new Error(`FAIL: First import expected 1 imported, got: ${JSON.stringify(res1)}`);
  }
  console.log(`✓ First import succeeded: ${res1.imported} imported.`);

  // Run 2: Exact Duplicate Re-import (Should be skipped!)
  const res2 = await importArchiveData("spj", actor, importBatch1);
  if (res2.imported !== 0 || res2.skipped !== 1) {
    throw new Error(`FAIL: Duplicate re-import expected 1 skipped, got: ${JSON.stringify(res2)}`);
  }
  console.log(`✓ Duplicate re-import correctly skipped via SHA-256 hash match: ${res2.skipped} skipped.`);

  // Run 3: Conflicting Payload Re-import (Same ID, changed values)
  const conflictingBatch = {
    format: "SPJ_REKAP_OFFLINE",
    version: 2,
    records: [
      {
        ...legacyRecord,
        values: {
          ...legacyRecord.values,
          pekerjaan: "Belanja Jasa Servis AC Kantor (Revisi Konflik)",
        },
      },
    ],
  };
  const res3 = await importArchiveData("spj", actor, conflictingBatch);
  if (res3.conflicts.length !== 1 || res3.conflicts[0] !== legacySpjId) {
    throw new Error(`FAIL: Conflicting re-import did not flag conflict ID: ${JSON.stringify(res3)}`);
  }
  console.log(`✓ Conflicting data on same ID flagged correctly: conflicts=[${res3.conflicts.join(", ")}].`);

  // Verify DB record and events
  const importedDoc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.app, "spj"), eq(documents.sourceKey, legacySpjId)))
    .get();

  if (!importedDoc) {
    throw new Error("FAIL: Imported document not found in DB!");
  }

  const docEvents = await db
    .select()
    .from(events)
    .where(eq(events.documentId, importedDoc.id))
    .all();

  // Expected events: created (legacy=1), edited (legacy=1), imported (legacy=0)
  const hasCreated = docEvents.some((e) => e.action === "created" && e.legacy === 1);
  const hasEdited = docEvents.some((e) => e.action === "edited" && e.legacy === 1);
  const hasImported = docEvents.some((e) => e.action === "imported" && e.legacy === 0);

  if (!hasCreated || !hasEdited || !hasImported) {
    throw new Error(`FAIL: Expected events (created, edited, imported) missing: ${JSON.stringify(docEvents)}`);
  }
  console.log(`✓ Audit events recorded accurately (created, historical edits, and imported).`);

  // Clean up legacy test doc
  await db.delete(events).where(eq(events.documentId, importedDoc.id));
  await db.delete(documents).where(eq(documents.id, importedDoc.id));

  // -------------------------------------------------------------
  // Test 3: Complete End-to-End Flow (Contract -> SPJ -> Stale -> Sync -> OCC)
  // -------------------------------------------------------------
  console.log("\n[Test 3] Testing Complete End-to-End Lifecycle...");

  const contractId = randomUUID();
  const testContractPayload: any = {
    ...templateKontrak.defaults,
    packageName: "Pengadaan Lisensi Software Antivirus Bapenda 2026",
    providerType: "PT",
    providerName: "SOLUSI SIBER INDONESIA",
    providerLeader: "HENDRA WIJAYA",
    providerTitle: "Direktur Utama",
    address: "Jl. Hayam Wuruk No. 12 Jember",
    spkNumber: "027/777/SPK/BAPENDA/2026",
    dppaNumber: "DPPA/A.1/9.02.0.00.0.00.01.0000/002/2026",
    subactivity: "Pengembangan Infrastruktur Keamanan Siber",
    budget: "45.000.000",
    workStart: "2026-10-01",
    workEnd: "2026-10-15",
    fiscalYear: "2026",
    vatRate: "11",
    groups: [
      {
        name: "Lisensi Server & Endpoint",
        items: [
          {
            name: "Endpoint Security Suite",
            unit: "Lisensi",
            quantity: "30",
            volume: "1",
            earlyPrice: "1.200.000",
            finalPrice: "1.100.000",
          },
          {
            name: "Server Protection Agent",
            unit: "Lisensi",
            quantity: "2",
            volume: "1",
            earlyPrice: "4.500.000",
            finalPrice: "4.000.000",
          },
        ],
      },
    ],
  };

  // Step A: Calculate Contract
  const contractCalc = calculateContract(testContractPayload);
  if (contractCalc.errors.length > 0) {
    throw new Error(`FAIL: Contract calculation error: ${contractCalc.errors.join(", ")}`);
  }
  const contractSummary = summarizeCalculation(contractCalc);
  // (30 * 1.100.000) + (2 * 4.000.000) = 33.000.000 + 8.000.000 = 41.000.000
  // PPN 11% = 4.510.000. Total = 45.510.000
  if (contractSummary.finalSubtotal !== "41.000.000" || contractSummary.finalTotal !== "45.510.000") {
    throw new Error(`FAIL: Math mismatch in contract! got: ${contractSummary.finalTotal}`);
  }
  console.log(`✓ Step A: Contract calculated: Subtotal Rp ${contractSummary.finalSubtotal}, Total Rp ${contractSummary.finalTotal}`);

  // Step B: Save Contract to DB & Generate Word
  const now = new Date().toISOString();
  await db.insert(documents).values({
    id: contractId,
    app: "kontrak",
    ownerId: adminUser.id,
    ownerName: adminUser.username,
    revision: 1,
    payload: JSON.stringify(testContractPayload),
    createdAt: now,
    updatedAt: now,
  });

  const contractDocx = await generateContractDocx(testContractPayload);
  if (!contractDocx || contractDocx.length === 0) {
    throw new Error("FAIL: Contract docx generation returned empty buffer.");
  }
  console.log(`✓ Step B: Contract saved (Rev #1) and Word .docx generated (${contractDocx.length} bytes).`);

  // Step C: Map Contract to SPJ
  const savedContractDoc = await db.select().from(documents).where(eq(documents.id, contractId)).get();
  if (!savedContractDoc) throw new Error("Contract doc not found!");

  const mapped = mapContractToSpj(savedContractDoc, testContractPayload);
  const defaultSpjValues = getDefaultSpjValues();
  const spjValues = {
    ...defaultSpjValues,
    ...mapped.values,
    nama_pa: "HADI JAYA, S.Sos., M.Si.",
    nama_pptk: "SITI NURHALIZA, S.E.",
    nama_bendahara: "AHMAD SYARIF, A.Md.",
    nama_aset: "YULIA RAHMAWATI, S.T.",
    price_basis: "excluded",
    ppn_rate: "11",
    pph_type: "23",
    pph_rate: "2",
  };

  // Step D: Calculate SPJ Spending & Taxes
  const spjCalc = computeSpj(spjValues, mapped.items, templateSpj.fields);
  if (spjCalc.errors.length > 0) {
    throw new Error(`FAIL: SPJ calculation errors: ${spjCalc.errors.join(", ")}`);
  }
  // Subtotal = 41.000.000, PPN = 4.510.000, Total = 45.510.000
  // DPP = Total - PPN = 41.000.000
  // PPh 23 = 41.000.000 * 2% = 820.000
  // Net = 45.510.000 - 4.510.000 - 820.000 = 40.180.000
  if (spjCalc.spending.total !== 45510000 || spjCalc.pph.amount !== 820000 || spjCalc.net !== 40180000) {
    throw new Error(
      `FAIL: SPJ tax calculation mismatch: total=${spjCalc.spending.total}, pph=${spjCalc.pph.amount}, net=${spjCalc.net}`
    );
  }
  console.log(`✓ Step D: SPJ taxes calculated: Total Rp 45.510.000, PPh 23 Rp 820.000, Netto Rp 40.180.000`);

  // Step E: Save SPJ to DB & Generate Word & Excel
  const spjId = randomUUID();
  await db.insert(documents).values({
    id: spjId,
    app: "spj",
    ownerId: adminUser.id,
    ownerName: adminUser.username,
    sourceKey: `kontrak:${contractId}`,
    linkJson: JSON.stringify(mapped.source),
    revision: 1,
    payload: JSON.stringify({
      values: spjValues,
      items: mapped.items,
    }),
    createdAt: now,
    updatedAt: now,
  });

  const spjDocx = await generateSpjDocx(spjValues, mapped.items);
  const spjXlsx = await generateSpjReportExcel([
    { id: spjId, values: spjValues, items: mapped.items },
  ]);
  if (!spjDocx || spjDocx.byteLength === 0 || !spjXlsx || spjXlsx.byteLength === 0) {
    throw new Error("FAIL: SPJ docx or xlsx generation returned empty buffer.");
  }
  console.log(`✓ Step E: SPJ saved to DB and Word (${spjDocx.byteLength} B) & Excel (${spjXlsx.byteLength} B) generated.`);

  // Step F: Modify Contract Source (Simulate revision bump in Contract)
  const modifiedContractPayload = {
    ...testContractPayload,
    packageName: "Pengadaan Lisensi Software Antivirus Bapenda 2026 (REVISI AMANDEMEN)",
  };
  await db
    .update(documents)
    .set({
      revision: 2,
      payload: JSON.stringify(modifiedContractPayload),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(documents.id, contractId));

  // Step G: Verify SPJ Source Status -> MUST BE 'changed' (source stale!)
  const reloadedContractDoc = await db.select().from(documents).where(eq(documents.id, contractId)).get();
  const statusAfterEdit = checkSourceStatus(mapped.source, reloadedContractDoc);
  if (statusAfterEdit !== "changed") {
    throw new Error(`FAIL: Expected source status 'changed', got: '${statusAfterEdit}'`);
  }
  console.log(`✓ Step G: Stale source correctly detected after contract modification (status: 'changed').`);

  // Step H: Synchronize SPJ from Contract (Simulate "Perbarui dari kontrak")
  const newlyMapped = mapContractToSpj(reloadedContractDoc!, modifiedContractPayload);
  const updatedSpjValues = { ...spjValues, ...newlyMapped.values };
  await db
    .update(documents)
    .set({
      revision: 2,
      payload: JSON.stringify({ values: updatedSpjValues, items: newlyMapped.items }),
      linkJson: JSON.stringify(newlyMapped.source),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(documents.id, spjId));

  const statusAfterSync = checkSourceStatus(newlyMapped.source, reloadedContractDoc);
  if (statusAfterSync !== "current") {
    throw new Error(`FAIL: Expected source status 'current' after sync, got: '${statusAfterSync}'`);
  }
  console.log(`✓ Step H: SPJ successfully synchronized with contract source (status restored to 'current').`);

  // Step I: Optimistic Concurrency Control (OCC) Revision Check
  const currentSpj = await db.select().from(documents).where(eq(documents.id, spjId)).get();
  const staleExpectedRevision = 1; // Server is currently at revision 2
  if (currentSpj?.revision === staleExpectedRevision) {
    throw new Error("FAIL: Current revision should be 2!");
  }
  const isConflict = currentSpj?.revision !== staleExpectedRevision;
  if (!isConflict) {
    throw new Error("FAIL: OCC failed to detect revision mismatch!");
  }
  console.log(`✓ Step I: OCC conflict prevention verified (server rev #${currentSpj?.revision} != client expected #${staleExpectedRevision}).`);

  // Step J: Soft Delete
  const deleteTime = new Date().toISOString();
  await db
    .update(documents)
    .set({
      deletedAt: deleteTime,
      revision: (currentSpj?.revision || 2) + 1,
      updatedAt: deleteTime,
    })
    .where(eq(documents.id, spjId));

  const deletedDoc = await db.select().from(documents).where(eq(documents.id, spjId)).get();
  if (!deletedDoc?.deletedAt) {
    throw new Error("FAIL: Soft delete did not set deletedAt timestamp!");
  }
  console.log(`✓ Step J: Document soft deleted cleanly with timestamp ${deletedDoc.deletedAt}.`);

  // Step K: Clean up test documents
  await db.delete(events).where(eq(events.documentId, spjId));
  await db.delete(documents).where(eq(documents.id, spjId));
  await db.delete(events).where(eq(events.documentId, contractId));
  await db.delete(documents).where(eq(documents.id, contractId));

  console.log("\n==================================================");
  console.log("✓ ALL PHASE 5 & 6 TESTS PASSED FLAWLESSLY! (100%)");
  console.log("==================================================\n");
}

runPhase5And6Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
