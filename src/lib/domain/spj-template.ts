import fs from "node:fs";
import path from "node:path";

export interface SpjFieldDef {
  key: string;
  label: string;
  value: string;
  group: string;
  kind: "text" | "textarea";
  note?: string;
}

export interface SpjTemplatePayload {
  fields: SpjFieldDef[];
  counts: Record<string, number>;
  store: string;
  dataNamespace: string;
  masterPages?: string[];
  source?: string;
  templateBase64: string;
  reportTemplateBase64: string;
}

export const SPJ_DATES: [string, string, string, string][] = [
  // [key, label, defaultIso, group]
  ["date_dpa", "Tanggal DPA atau DPPA", "2026-10-14", "Dasar"],
  ["date_sp", "Tanggal Surat Pesanan (SPK)", "2026-10-19", "Dasar"],
  ["date_selesai", "Batas akhir penyelesaian pekerjaan", "2026-10-21", "Pelaksanaan"],
  ["date_penyerahan", "Tanggal penyerahan pekerjaan", "2026-10-21", "Pelaksanaan"],
  ["date_adm", "Tanggal BA pemeriksaan administrasi", "2026-10-21", "Pemeriksaan"],
  ["date_periksa", "Tanggal BA hasil pemeriksaan barang/jasa", "2026-10-21", "Pemeriksaan"],
  ["date_bast_ppk", "Tanggal BAST penyedia ke PPK", "2026-10-21", "Serah Terima"],
  ["date_bast_aset", "Tanggal BAST pengurus aset", "2026-10-21", "Serah Terima"],
  ["date_terima", "Tanggal barang diterima pada Surat Pesanan", "2026-10-21", "Pelaksanaan"],
  ["date_permohonan_bayar", "Tanggal surat permohonan pembayaran", "2026-11-05", "Pembayaran"],
  ["date_bapp", "Tanggal BA persetujuan pembayaran (BAPP)", "2026-11-05", "Pembayaran"],
  ["date_ringkasan", "Tanggal ringkasan kontrak (opsional)", "", "Pencairan"],
  ["date_kuitansi", "Tanggal kuitansi pembayaran", "", "Pencairan"],
  ["date_nota_laporan", "Tanggal nota dinas laporan hasil", "", "Pencairan"],
  ["date_nota_cair", "Tanggal nota dinas pengajuan pencairan", "", "Pencairan"],
  ["date_sk_pa", "Tanggal SK PA atau PPK", "2026-01-02", "SK Pejabat"],
  ["date_sk_pptk", "Tanggal SK PPTK", "2026-01-12", "SK Pejabat"],
  ["date_sk_aset", "Tanggal SK pengurus aset", "", "SK Pejabat"],
];

let cachedSpjTemplate: SpjTemplatePayload | null = null;

export function getSpjTemplate(): SpjTemplatePayload {
  if (cachedSpjTemplate) return cachedSpjTemplate;

  const templatePath = path.join(process.cwd(), "templates", "spj.json");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Berkas template SPJ tidak ditemukan pada: ${templatePath}`);
  }

  const raw = fs.readFileSync(templatePath, "utf-8");
  cachedSpjTemplate = JSON.parse(raw) as SpjTemplatePayload;
  return cachedSpjTemplate;
}

export function getDefaultSpjValues(): Record<string, string> {
  const template = getSpjTemplate();
  const values: Record<string, string> = {};

  // Fill default values from template fields
  for (const f of template.fields) {
    values[f.key] = f.value || "";
  }

  // Fill default dates
  for (const [key, , defaultVal] of SPJ_DATES) {
    values[key] = defaultVal;
  }

  // Calculation parameters
  values.days = "3";
  values.ppn_rate = "11";
  values.price_basis = "included";
  values.pph_type = "23";
  values.pph_rate = "2";
  values.masa_pemeliharaan = "3";

  return values;
}
