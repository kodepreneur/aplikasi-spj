import { z } from "zod";

export const contractItemSchema = z.object({
  name: z.string().trim().min(1, "Nama barang/jasa wajib diisi."),
  unit: z.string().trim().min(1, "Satuan wajib diisi."),
  quantity: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
  volume: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
  earlyPrice: z.union([z.string(), z.number()]).transform((val) => String(val).trim()),
  finalPrice: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? String(val).trim() : "")),
});

export const contractGroupSchema = z.object({
  name: z.string().trim().min(1, "Nama kelompok uraian pekerjaan wajib diisi."),
  items: z.array(contractItemSchema).min(1, "Setiap kelompok minimal memiliki 1 item barang/jasa."),
});

export const contractPayloadSchema = z.object({
  // Identitas Paket
  packageName: z.string().trim().min(3, "Nama paket pengadaan minimal 3 karakter."),
  program: z.string().trim().default("PENGELOLAAN PENDAPATAN DAERAH"),
  activity: z.string().trim().default("PENGELOLAAN PENDAPATAN DAERAH"),
  subactivity: z.string().trim().default(""),
  coverAddition: z.string().trim().optional().default(""),
  scope: z.string().trim().default(""),
  accountCode: z.string().trim().default(""),
  budget: z.string().trim().min(1, "Pagu anggaran wajib diisi."),
  vatRate: z.string().trim().default("11"),
  fiscalYear: z.string().trim().default(() => new Date().getFullYear().toString()),
  paymentMonth: z.string().trim().default(""),

  // DPPA & Pelaksanaan
  dppaNumber: z.string().trim().default(""),
  dppaDate: z.string().trim().default(""),
  workStart: z.string().trim().default(""),
  workEnd: z.string().trim().default(""),

  // Rekanan / Penyedia
  providerType: z.string().trim().default("CV"),
  providerName: z.string().trim().min(1, "Nama penyedia wajib diisi."),
  address: z.string().trim().default(""),
  npwp: z.string().trim().default(""),
  signatory: z.string().trim().default(""),
  providerPhone: z.string().trim().optional().default(""),

  // Pejabat
  decisionNumber: z.string().trim().optional().default(""),
  decisionDate: z.string().trim().optional().default(""),
  ppkName: z.string().trim().default(""),
  ppkPlanningNip: z.string().trim().default(""),
  ppkSpkNip: z.string().trim().default(""),
  procurementName: z.string().trim().default(""),
  procurementNip: z.string().trim().default(""),

  // Surat-surat pengadaan (18 surat / tahapan)
  pptkNoteDate: z.string().trim().optional().default(""),
  pptkNoteNumber: z.string().trim().optional().default(""),
  hpsDate: z.string().trim().optional().default(""),
  ppkNoteDate: z.string().trim().optional().default(""),
  ppkNoteNumber: z.string().trim().optional().default(""),
  specificationDate: z.string().trim().optional().default(""),
  invitationDate: z.string().trim().optional().default(""),
  invitationNumber: z.string().trim().optional().default(""),
  submissionDate: z.string().trim().optional().default(""),
  negotiationScheduleDate: z.string().trim().optional().default(""),
  offerDate: z.string().trim().optional().default(""),
  interestDate: z.string().trim().optional().default(""),
  integrityDate: z.string().trim().optional().default(""),
  openingDate: z.string().trim().optional().default(""),
  openingNumber: z.string().trim().optional().default(""),
  negotiationDate: z.string().trim().optional().default(""),
  negotiationNumber: z.string().trim().optional().default(""),
  bahplDate: z.string().trim().optional().default(""),
  bahplNumber: z.string().trim().optional().default(""),
  awardDate: z.string().trim().optional().default(""),
  awardNumber: z.string().trim().optional().default(""),
  announcementDate: z.string().trim().optional().default(""),
  announcementNumber: z.string().trim().optional().default(""),
  deliveryNoteDate: z.string().trim().optional().default(""),
  deliveryNoteNumber: z.string().trim().optional().default(""),
  sppbjDate: z.string().trim().optional().default(""),
  sppbjNumber: z.string().trim().optional().default(""),
  spkDate: z.string().trim().optional().default(""),
  spkNumber: z.string().trim().optional().default(""),

  // Tabel RAB Dinamis
  groups: z.array(contractGroupSchema).min(1, "Minimal harus ada 1 kelompok uraian pekerjaan."),
});

export type ContractPayloadInput = z.infer<typeof contractPayloadSchema>;
export type ContractGroupInput = z.infer<typeof contractGroupSchema>;
export type ContractItemInput = z.infer<typeof contractItemSchema>;
