"use client";

import type { ChangeEvent } from "react";
import { Calendar, Lock } from "lucide-react";
import { LINKED_FIELDS } from "@/lib/domain/link-mapper";

interface DatesSectionProps {
  values: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isLinked?: boolean;
}

export function DatesSection({
  values,
  onChange,
  isLinked = false,
}: DatesSectionProps) {
  const isLocked = (key: string) => isLinked && Boolean(LINKED_FIELDS[key]);

  const groups = [
    {
      title: "1. Dasar Pengadaan & Pesanan",
      dates: [
        { key: "date_dpa", label: "Tanggal DPA / DPPA" },
        { key: "date_sp", label: "Tanggal Surat Pesanan (SPK)" },
      ],
    },
    {
      title: "2. Pelaksanaan & Penyerahan Pekerjaan",
      dates: [
        { key: "date_selesai", label: "Batas Akhir Pelaksanaan" },
        { key: "date_penyerahan", label: "Tanggal Penyerahan Pekerjaan" },
        { key: "date_terima", label: "Tanggal Barang Diterima Rekanan" },
      ],
    },
    {
      title: "3. Pemeriksaan Teknis & Administrasi",
      dates: [
        { key: "date_adm", label: "Tanggal BA Pemeriksaan Administrasi" },
        { key: "date_periksa", label: "Tanggal BA Hasil Pemeriksaan" },
      ],
    },
    {
      title: "4. Berita Acara Serah Terima (BAST)",
      dates: [
        { key: "date_bast_ppk", label: "Tanggal BAST Rekanan ke PPK" },
        { key: "date_bast_aset", label: "Tanggal BAST Pengurus Aset" },
      ],
    },
    {
      title: "5. Permohonan & Persetujuan Pembayaran",
      dates: [
        { key: "date_permohonan_bayar", label: "Tanggal Surat Permohonan Pembayaran" },
        { key: "date_bapp", label: "Tanggal BA Persetujuan Pembayaran (BAPP)" },
      ],
    },
    {
      title: "6. Pencairan & Pertanggungjawaban Keuangan",
      dates: [
        { key: "date_ringkasan", label: "Tanggal Ringkasan Kontrak (Opsional)" },
        { key: "date_kuitansi", label: "Tanggal Kuitansi Pembayaran" },
        { key: "date_nota_laporan", label: "Tanggal Nota Dinas Laporan Hasil" },
        { key: "date_nota_cair", label: "Tanggal Nota Dinas Pencairan" },
      ],
    },
    {
      title: "7. Surat Keputusan (SK) Pejabat",
      dates: [
        { key: "date_sk_pa", label: "Tanggal SK PA atau PPK" },
        { key: "date_sk_pptk", label: "Tanggal SK PPTK" },
        { key: "date_sk_aset", label: "Tanggal SK Pengurus Aset" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((grp, gIdx) => (
        <div key={gIdx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-semibold text-slate-900">{grp.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {grp.dates.map((d) => {
              const locked = isLocked(d.key);
              return (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {d.label}
                    </label>
                    {locked && <Lock className="w-3 h-3 text-emerald-800" />}
                  </div>
                  <input
                    type="date"
                    name={d.key}
                    value={values[d.key] || ""}
                    onChange={onChange}
                    readOnly={locked}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                      locked
                        ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                        : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
