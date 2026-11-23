import {
  type SpjItemInput,
  decimalProduct,
  calculateSpending,
  numberValue,
} from "./tax-calc";
import { company as getCompany, formatPriceInput } from "./contract-calc";
import type { Document } from "@/lib/db/schema";

export const LINKED_FIELDS: Record<string, string> = {
  pekerjaan: "Nama paket pekerjaan",
  nama_penyedia: "Nama penyedia",
  bentuk_usaha: "Bentuk badan usaha",
  alamat_penyedia: "Alamat penyedia",
  npwp: "NPWP",
  wakil_penyedia: "Penandatangan penyedia",
  nomor_sp: "Nomor Surat Pesanan dari SPK",
  date_sp: "Tanggal SPK",
  nomor_dpa: "Nomor DPPA",
  date_dpa: "Tanggal DPPA",
  sub_kegiatan: "Subkegiatan",
  kegiatan: "Kegiatan",
  program: "Program",
  kode_rekening: "Kode rekening",
  tahun_anggaran: "Tahun anggaran",
  bagian_bulan: "Bulan pembayaran",
  nama_pa: "Nama PPK",
  nip_pa: "NIP PPK pada SPK",
  date_selesai: "Batas akhir pelaksanaan",
  days: "Jangka waktu pelaksanaan",
  price_basis: "Dasar harga RAB",
  ppn_rate: "Tarif PPN dari kontrak",
};

export interface SpjSourceSnapshot {
  id: string;
  revision: number;
  spk: string;
  title: string;
  company: string;
  date: string;
  owner: string;
  subtotal: number;
  ppn: number;
  total: number;
  snapshot: {
    values: Record<string, string>;
    items: SpjItemInput[];
  };
}

export interface MapContractResult {
  values: Record<string, string>;
  items: SpjItemInput[];
  source: SpjSourceSnapshot;
  fields: Record<string, string>;
}

export type SourceStatus = "none" | "current" | "changed" | "deleted";

export function mapContractToSpj(
  contractDoc: Document,
  contractPayload: any
): MapContractResult {
  const data = contractPayload;

  // Validation
  for (const [key, label] of [
    ["packageName", "nama paket pengadaan"],
    ["providerName", "nama penyedia"],
    ["address", "alamat penyedia"],
    ["spkNumber", "nomor SPK"],
    ["dppaNumber", "nomor DPPA"],
    ["subactivity", "subkegiatan"],
    ["workStart", "awal pelaksanaan"],
    ["workEnd", "akhir pelaksanaan"],
  ]) {
    if (!String(data[key] || "").trim()) {
      throw new Error(`Lengkapi ${label} pada kontrak terlebih dahulu.`);
    }
  }

  const startMs = Date.parse(data.workStart + "T00:00:00Z");
  const endMs = Date.parse(data.workEnd + "T00:00:00Z");
  if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) {
    throw new Error("Rentang tanggal pelaksanaan kontrak tidak valid.");
  }

  const days = Math.round((endMs - startMs) / 86_400_000) + 1;
  if (!Number.isInteger(days) || days < 1 || days > 36600) {
    throw new Error("Jangka waktu pelaksanaan kontrak di luar batas SPJ.");
  }

  const providerType = data.providerType || "CV";
  const bentukUsaha = providerType.endsWith(".") ? providerType : providerType + ".";

  const values: Record<string, string> = {
    pekerjaan: data.packageName || "",
    nama_penyedia: (data.providerName || "").replace(/^(?:PT|CV)\.?\s+/i, ""),
    bentuk_usaha: bentukUsaha,
    alamat_penyedia: data.address || "",
    npwp: data.npwp || "",
    wakil_penyedia: data.signatory || "",
    nomor_sp: data.spkNumber || "",
    date_sp: data.spkDate || "",
    nomor_dpa: data.dppaNumber || "",
    date_dpa: data.dppaDate || "",
    sub_kegiatan: data.subactivity || "",
    kegiatan: data.activity || "",
    program: data.program || "",
    kode_rekening: data.accountCode || "",
    tahun_anggaran: data.fiscalYear || "2026",
    bagian_bulan: [data.paymentMonth, data.fiscalYear].filter(Boolean).join(" "),
    nama_pa: data.ppkName || "",
    nip_pa: data.ppkSpkNip || "",
    date_selesai: data.workEnd || "",
    days: String(days),
    price_basis: "excluded",
    ppn_rate: data.vatRate || "11",
  };

  // Flatten RAB groups into SPJ items
  const items: SpjItemInput[] = (data.groups || []).flatMap((group: any) =>
    (group.items || []).map((item: any) => {
      const unitPriceStr = String(item.finalPrice ?? "").trim() || String(item.earlyPrice ?? "").trim();
      return {
        description: item.name || "",
        unit: item.unit || "",
        quantity: decimalProduct(item.quantity, item.volume),
        unitPrice: formatPriceInput(unitPriceStr),
        detail: `${group.name || "Pekerjaan"} · QTY ${item.quantity} × Vol ${item.volume}`,
      };
    })
  );

  if (items.some((item) => item.unit.length > 100)) {
    throw new Error("Satuan pada RAB kontrak maksimal 100 karakter untuk diteruskan ke SPJ.");
  }

  const totals = calculateSpending(values, items);
  if (totals.errors.length > 0) {
    throw new Error(`Hasil perhitungan belanja SPJ belum valid: ${totals.errors[0]}`);
  }

  const source: SpjSourceSnapshot = {
    id: contractDoc.id,
    revision: contractDoc.revision,
    spk: data.spkNumber || "",
    title: data.packageName || "",
    company: getCompany(data),
    date: data.spkDate || "",
    owner: contractDoc.ownerName,
    subtotal: totals.base,
    ppn: totals.ppn,
    total: totals.total,
    snapshot: {
      values,
      items,
    },
  };

  return {
    values,
    items,
    source,
    fields: LINKED_FIELDS,
  };
}

export function checkSourceStatus(
  sourceSnapshot: SpjSourceSnapshot | null | undefined,
  latestContract: Document | null | undefined
): SourceStatus {
  if (!sourceSnapshot) return "none";
  if (!latestContract || latestContract.deletedAt) return "deleted";
  if (latestContract.revision !== sourceSnapshot.revision) return "changed";
  return "current";
}

export function matchesSnapshot(
  dataValues: Record<string, any>,
  dataItems: SpjItemInput[],
  source: SpjSourceSnapshot
): boolean {
  const valuesMatch = Object.keys(source.snapshot.values).every(
    (key) => dataValues[key] === source.snapshot.values[key]
  );
  if (!valuesMatch) return false;

  if (!Array.isArray(dataItems) || dataItems.length !== source.snapshot.items.length) {
    return false;
  }

  return dataItems.every((item, idx) => {
    const snapItem = source.snapshot.items[idx];
    if (!snapItem) return false;
    return (
      item.description === snapItem.description &&
      item.unit === snapItem.unit &&
      item.quantity === snapItem.quantity &&
      item.unitPrice === snapItem.unitPrice
    );
  });
}
