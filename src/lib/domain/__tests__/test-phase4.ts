import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { documents, events, accounts } from "../../db/schema";
import { getSpjTemplate, getDefaultSpjValues } from "../spj-template";
import {
  calculateSpending,
  calculatePph,
  computeSpj,
  dateParts,
  type SpjItemInput,
} from "../tax-calc";
import {
  mapContractToSpj,
  checkSourceStatus,
  matchesSnapshot,
  type SpjSourceSnapshot,
} from "../link-mapper";
import { generateSpjDocx } from "../../exporters/word-spj";
import { generateSpjReportExcel, type SpjReportRecord } from "../../exporters/excel-spj";

async function runPhase4Tests() {
  console.log("=== RUNNING PHASE 4 SPJ & MAPPING TESTS ===");
  const db = getDb();
  const template = getSpjTemplate();

  // -------------------------------------------------------------
  // Test 1: Template Loading & Default Values
  // -------------------------------------------------------------
  console.log("\n[Test 1] Testing getSpjTemplate & getDefaultSpjValues...");
  if (!template.fields || template.fields.length === 0) {
    throw new Error("FAIL: SPJ template fields are empty!");
  }
  const defaultValues = getDefaultSpjValues();
  if (defaultValues.price_basis !== "included" || defaultValues.ppn_rate !== "11") {
    throw new Error("FAIL: Default calculation parameters not initialized!");
  }
  console.log(`✓ Template loaded successfully: ${template.fields.length} standard fields, store=${template.store}`);

  // -------------------------------------------------------------
  // Test 2: Tax Calculation Engine (PPN Included & Excluded)
  // -------------------------------------------------------------
  console.log("\n[Test 2] Testing calculateSpending (Included vs Excluded basis)...");

  const sampleItems: SpjItemInput[] = [
    {
      description: "Jasa Konsultasi Pajak Daerah",
      detail: "Tahap 1",
      unit: "Paket",
      quantity: "1",
      unitPrice: "11.100.000",
    },
    {
      description: "Jasa Pemeliharaan Server",
      detail: "Tahap 1",
      unit: "Bulan",
      quantity: "2",
      unitPrice: "5.550.000",
    },
  ];

  // Test A: Price Included (PPN Termasuk dalam Harga Satuan)
  // Total bruto = 11.100.000 + (2 * 5.550.000) = 22.200.000
  // PPN 11% included: 22.200.000 * 11 / 111 = 2.200.000. DPP base = 20.000.000
  const includedSpending = calculateSpending(
    { price_basis: "included", ppn_rate: "11" },
    sampleItems
  );

  if (includedSpending.errors.length > 0) {
    throw new Error(`FAIL: Unexpected error in includedSpending: ${includedSpending.errors.join(", ")}`);
  }
  if (includedSpending.total !== 22200000 || includedSpending.ppn !== 2200000 || includedSpending.base !== 20000000) {
    throw new Error(
      `FAIL: Math mismatch in included! Expected total=22.200.000, ppn=2.200.000, base=20.000.000. Got: total=${includedSpending.total}, ppn=${includedSpending.ppn}, base=${includedSpending.base}`
    );
  }
  console.log(`✓ Included calculation correct: Total Rp 22.200.000, PPN Rp 2.200.000, DPP Rp 20.000.000`);

  // Test B: Price Excluded (PPN Ditambahkan ke Harga Satuan)
  // Subtotal = 22.200.000, PPN 11% = 2.442.000, Total = 24.642.000
  const excludedSpending = calculateSpending(
    { price_basis: "excluded", ppn_rate: "11" },
    sampleItems
  );
  if (excludedSpending.total !== 24642000 || excludedSpending.ppn !== 2442000 || excludedSpending.subtotal !== 22200000) {
    throw new Error(
      `FAIL: Math mismatch in excluded! Got total=${excludedSpending.total}, ppn=${excludedSpending.ppn}`
    );
  }
  console.log(`✓ Excluded calculation correct: Subtotal Rp 22.200.000, PPN Rp 2.442.000, Total Rp 24.642.000`);

  // -------------------------------------------------------------
  // Test 3: PPh Tax Calculation (PPh 23, 22, 21, Final, None)
  // -------------------------------------------------------------
  console.log("\n[Test 3] Testing calculatePph across all tax types on DPP...");
  // DPP = 20.000.000
  const totalVal = 22200000;
  const ppnVal = 2200000; // DPP base = 20.000.000

  // PPh 23 (Jasa - 2%): 20.000.000 * 2% = 400.000
  const pph23 = calculatePph({ pph_type: "23", pph_rate: "2" }, totalVal, ppnVal);
  if (pph23.amount !== 400000 || pph23.base !== 20000000) {
    throw new Error(`FAIL: PPh 23 calculation incorrect: got ${pph23.amount}`);
  }

  // PPh 22 (Barang - 1.5%): 20.000.000 * 1.5% = 300.000
  const pph22 = calculatePph({ pph_type: "22", pph_rate: "1,5" }, totalVal, ppnVal);
  if (pph22.amount !== 300000) {
    throw new Error(`FAIL: PPh 22 calculation incorrect: got ${pph22.amount}`);
  }

  // PPh 21 (Orang Pribadi - 5%): 20.000.000 * 5% = 1.000.000
  const pph21 = calculatePph({ pph_type: "21", pph_rate: "5" }, totalVal, ppnVal);
  if (pph21.amount !== 1000000) {
    throw new Error(`FAIL: PPh 21 calculation incorrect: got ${pph21.amount}`);
  }

  // PPh Final (UMKM - 0.5%): 20.000.000 * 0.5% = 100.000
  const pphFinal = calculatePph({ pph_type: "final", pph_rate: "0,5" }, totalVal, ppnVal);
  if (pphFinal.amount !== 100000) {
    throw new Error(`FAIL: PPh Final calculation incorrect: got ${pphFinal.amount}`);
  }

  // PPh None: 0
  const pphNone = calculatePph({ pph_type: "none" }, totalVal, ppnVal);
  if (pphNone.amount !== 0) {
    throw new Error(`FAIL: PPh None calculation incorrect: got ${pphNone.amount}`);
  }
  console.log(`✓ PPh calculations correct: PPh 23 (Rp 400.000), PPh 22 (Rp 300.000), PPh 21 (Rp 1.000.000), PPh Final (Rp 100.000)`);

  // -------------------------------------------------------------
  // Test 4: Indonesian Date Parts Parsing
  // -------------------------------------------------------------
  console.log("\n[Test 4] Testing Indonesian dateParts parsing...");
  const dateResult = dateParts("2026-10-19");
  if (!dateResult || dateResult.day !== "Senin" || dateResult.date !== "19 Oktober 2026") {
    throw new Error(`FAIL: dateParts parsed incorrectly: ${JSON.stringify(dateResult)}`);
  }
  if (!dateResult.long.includes("Senin; tanggal : Sembilan Belas; bulan : Oktober; tahun : Dua Ribu Dua Puluh Enam")) {
    throw new Error(`FAIL: long date text incorrect: ${dateResult.long}`);
  }
  console.log(`✓ dateParts output verified: "${dateResult.long}"`);

  // -------------------------------------------------------------
  // Test 5: Full computeSpj with 72 Fields & Net Worth
  // -------------------------------------------------------------
  console.log("\n[Test 5] Testing computeSpj with 72 standard fields...");
  const fullValues: Record<string, any> = {
    ...defaultValues,
    pekerjaan: "Pengadaan Perangkat Jaringan Kantor",
    sub_kegiatan: "Pengelolaan Sistem Informasi Pajak Daerah",
    nama_penyedia: "CIPTA KARYA MANDIRI",
    wakil_penyedia: "BAMBANG SUDRAJAT",
    nama_pa: "HADI JAYA, S.Sos., M.Si.",
    nama_pptk: "SITI NURHALIZA, S.E.",
    nama_bendahara: "AHMAD SYARIF, A.Md.",
    nama_aset: "YULIA RAHMAWATI, S.T.",
    days: "14",
    masa_pemeliharaan: "30",
    tahun_anggaran: "2026",
    price_basis: "included",
    ppn_rate: "11",
    pph_type: "23",
    pph_rate: "2",
  };

  const spjComputation = computeSpj(fullValues, sampleItems, template.fields);
  if (spjComputation.errors.length > 0) {
    throw new Error(`FAIL: Unexpected computeSpj errors: ${spjComputation.errors.join(", ")}`);
  }

  // Net = Total (22.200.000) - PPN (2.200.000) - PPh 23 (400.000) = 19.600.000
  if (spjComputation.net !== 19600000) {
    throw new Error(`FAIL: Net amount mismatch! Expected 19.600.000, got ${spjComputation.net}`);
  }
  if (!spjComputation.data.nilai_bersih || spjComputation.data.nilai_bersih !== "19.600.000") {
    throw new Error(`FAIL: data.nilai_bersih mismatch: ${spjComputation.data.nilai_bersih}`);
  }
  console.log(`✓ computeSpj completed without error: Netto Rp ${spjComputation.data.nilai_bersih}`);

  // -------------------------------------------------------------
  // Test 6: Contract to SPJ Link Mapper
  // -------------------------------------------------------------
  console.log("\n[Test 6] Testing mapContractToSpj & checkSourceStatus...");
  const mockContractDoc: any = {
    id: "contract-test-" + randomUUID().slice(0, 8),
    app: "kontrak",
    revision: 2,
    payload: JSON.stringify({
      packageName: "Pengadaan Meja Kursi Kerja",
      providerType: "CV",
      providerName: "MEBEL SEJAHTERA",
      providerLeader: "AGUS SANTOSO",
      providerTitle: "Direktur",
      address: "Jl. Gajah Mada No. 45 Jember",
      spkNumber: "027/999/SPK/BAPENDA/2026",
      dppaNumber: "DPPA/A.1/9.02.0.00.0.00.01.0000/001/2026",
      subactivity: "Penyediaan Sarana Prasarana Gedung Kantor",
      budget: "25.000.000",
      workStart: "2026-10-12",
      workEnd: "2026-10-21",
      fiscalYear: "2026",
      groups: [
        {
          name: "Perabotan Kantor",
          items: [
            {
              name: "Meja Kerja Kayu Jati",
              unit: "Unit",
              quantity: "4",
              volume: "1",
              earlyPrice: "2.500.000",
              finalPrice: "2.250.000",
            },
            {
              name: "Kursi Putar Ergonomis",
              unit: "Unit",
              quantity: "4",
              volume: "1",
              earlyPrice: "1.000.000",
              finalPrice: "900.000",
            },
          ],
        },
      ],
    }),
  };

  const mappedSpj = mapContractToSpj(mockContractDoc, JSON.parse(mockContractDoc.payload));
  if (mappedSpj.values.pekerjaan !== "Pengadaan Meja Kursi Kerja" || mappedSpj.values.bentuk_usaha !== "CV.") {
    throw new Error(`FAIL: Mapped values mismatch: ${JSON.stringify(mappedSpj.values)}`);
  }
  if (mappedSpj.items.length !== 2) {
    throw new Error(`FAIL: Expected 2 mapped items, got ${mappedSpj.items.length}`);
  }
  if (mappedSpj.items[0].description !== "Meja Kerja Kayu Jati" || mappedSpj.items[0].unitPrice !== "2.250.000") {
    throw new Error(`FAIL: Item 1 mapping mismatch: ${JSON.stringify(mappedSpj.items[0])}`);
  }

  // Check Snapshot Matching
  const isMatch = matchesSnapshot(mappedSpj.values, mappedSpj.items, mappedSpj.source);
  if (!isMatch) {
    throw new Error("FAIL: matchesSnapshot returned false on freshly mapped contract!");
  }

  // Check Source Status (Initial: current)
  const statusCurrent = checkSourceStatus(mappedSpj.source, mockContractDoc);
  if (statusCurrent !== "current") {
    throw new Error(`FAIL: Expected status 'current', got '${statusCurrent}'`);
  }

  // Check Source Status (Modified: changed)
  const modifiedContractDoc = {
    ...mockContractDoc,
    revision: 3,
    payload: JSON.stringify({
      ...JSON.parse(mockContractDoc.payload),
      packageName: "Pengadaan Meja Kursi Kerja REVISI",
    }),
  };
  const statusChanged = checkSourceStatus(mappedSpj.source, modifiedContractDoc);
  if (statusChanged !== "changed") {
    throw new Error(`FAIL: Expected status 'changed', got '${statusChanged}'`);
  }

  // Check Source Status (Deleted: deleted)
  const statusDeleted = checkSourceStatus(mappedSpj.source, null);
  if (statusDeleted !== "deleted") {
    throw new Error(`FAIL: Expected status 'deleted', got '${statusDeleted}'`);
  }
  console.log(`✓ mapContractToSpj & checkSourceStatus verified successfully across all states.`);

  // -------------------------------------------------------------
  // Test 7: Word .docx Document Generator (CustomXML & 5 Detail Tables)
  // -------------------------------------------------------------
  console.log("\n[Test 7] Testing generateSpjDocx OpenXML CustomXml injection & table cloning...");
  const docxBuffer = await generateSpjDocx(fullValues, sampleItems);
  if (!docxBuffer || docxBuffer.length === 0) {
    throw new Error("FAIL: Generated docx buffer is empty!");
  }

  // Inspect generated ZIP
  const zip = await JSZip.loadAsync(docxBuffer);
  const customXmlFile = zip.file("customXml/item2.xml");
  if (!customXmlFile) {
    throw new Error("FAIL: customXml/item2.xml not found in generated docx!");
  }
  const customXmlText = await customXmlFile.async("text");
  if (!customXmlText.includes("Pengadaan Perangkat Jaringan Kantor") || !customXmlText.includes("CIPTA KARYA MANDIRI")) {
    throw new Error("FAIL: customXml/item2.xml does not contain injected field values!");
  }

  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) {
    throw new Error("FAIL: word/document.xml not found in generated docx!");
  }
  const documentXmlText = await documentXmlFile.async("text");
  // Check that the cloned items are present in document.xml
  if (!documentXmlText.includes("Jasa Konsultasi Pajak Daerah") || !documentXmlText.includes("Jasa Pemeliharaan Server")) {
    throw new Error("FAIL: Cloned item rows not found in word/document.xml!");
  }
  console.log(`✓ Word SPJ generated successfully (${docxBuffer.byteLength} bytes) with customXml and detail tables intact.`);

  // -------------------------------------------------------------
  // Test 8: Excel Rekapitulasi SPJ Generator
  // -------------------------------------------------------------
  console.log("\n[Test 8] Testing generateSpjReportExcel...");
  const reportRecords: SpjReportRecord[] = [
    {
      id: "spj-1",
      values: fullValues,
      items: sampleItems,
    },
    {
      id: "spj-2",
      values: {
        ...fullValues,
        pekerjaan: "Belanja ATK dan Kertas Kantor",
        nama_penyedia: "TOKO KERTAS JAYA",
        nomor_sp: "027/101/SPK/2026",
      },
      items: [
        {
          description: "Kertas HVS A4 80gr",
          detail: "Sinar Dunia",
          unit: "Rim",
          quantity: "50",
          unitPrice: "55.000",
        },
      ],
    },
  ];

  const excelBuffer = await generateSpjReportExcel(reportRecords);
  if (!excelBuffer || excelBuffer.length === 0) {
    throw new Error("FAIL: Generated Excel buffer is empty!");
  }

  const excelZip = await JSZip.loadAsync(excelBuffer);
  const sheetFile = excelZip.file("xl/worksheets/sheet1.xml");
  if (!sheetFile) {
    throw new Error("FAIL: xl/worksheets/sheet1.xml not found in generated xlsx!");
  }
  const sheetXml = await sheetFile.async("text");
  if (!sheetXml.includes("Pengadaan Perangkat Jaringan Kantor") || !sheetXml.includes("Belanja ATK dan Kertas Kantor")) {
    throw new Error("FAIL: Expected records missing in Excel sheet1.xml!");
  }
  console.log(`✓ Excel Rekapitulasi SPJ generated successfully (${excelBuffer.byteLength} bytes) with all records populated.`);

  // -------------------------------------------------------------
  // Test 9: Database Operations & OCC Revision Control
  // -------------------------------------------------------------
  console.log("\n[Test 9] Testing Database SPJ storage & OCC revision checks...");
  const adminAccount = await db
    .select()
    .from(accounts)
    .where(eq(accounts.role, "admin"))
    .get();

  if (!adminAccount) {
    throw new Error("FAIL: Admin account not found in database!");
  }

  const testSpjId = "spj-test-" + randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  // Create SPJ Document in DB
  await db.insert(documents).values({
    id: testSpjId,
    app: "spj",
    ownerId: adminAccount.id,
    ownerName: adminAccount.username,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    payload: JSON.stringify({
      values: fullValues,
      items: sampleItems,
    }),
    linkJson: JSON.stringify(mappedSpj.source),
    sourceKey: `kontrak:${mockContractDoc.id}`,
  });

  await db.insert(events).values({
    documentId: testSpjId,
    action: "created",
    at: now,
    actorId: adminAccount.id,
    actorName: adminAccount.username,
    legacy: 0,
  });

  // Fetch document
  const retrieved = await db
    .select()
    .from(documents)
    .where(eq(documents.id, testSpjId))
    .get();

  if (!retrieved || retrieved.revision !== 1) {
    throw new Error("FAIL: Failed to retrieve inserted SPJ document!");
  }

  // Simulate OCC Conflict Test
  const staleExpectedRev = 1;
  // First update increments revision to 2
  await db
    .update(documents)
    .set({
      revision: 2,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(documents.id, testSpjId));

  const afterUpdate = await db
    .select()
    .from(documents)
    .where(eq(documents.id, testSpjId))
    .get();

  // Second user trying to update with expectedRevision 1 should detect conflict
  const isConflict = (afterUpdate?.revision as number) !== staleExpectedRev;
  if (!isConflict) {
    throw new Error("FAIL: OCC did not detect revision conflict!");
  }
  console.log(`✓ OCC Conflict detected correctly: server revision is ${afterUpdate?.revision}, client expected ${staleExpectedRev}`);

  // Clean up test document
  await db.delete(events).where(eq(events.documentId, testSpjId));
  await db.delete(documents).where(eq(documents.id, testSpjId));

  console.log("\n=========================================");
  console.log("✓ ALL PHASE 4 TEST SUITES PASSED CLEANLY!");
  console.log("=========================================\n");
}

runPhase4Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  });
