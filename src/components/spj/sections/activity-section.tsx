"use client";

import type { ChangeEvent } from "react";
import { Lock } from "lucide-react";
import { LINKED_FIELDS } from "@/lib/domain/link-mapper";

interface ActivitySectionProps {
  values: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isLinked?: boolean;
  errors?: string[];
}

export function ActivitySection({
  values,
  onChange,
  isLinked = false,
  errors = [],
}: ActivitySectionProps) {
  const isLocked = (key: string) => isLinked && Boolean(LINKED_FIELDS[key]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Kegiatan & Anggaran Pelaksanaan
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Identitas paket belanja, program, rekening pengeluaran, dan dasar anggaran DPA/DPPA.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Nama Pekerjaan */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nama Paket Pekerjaan / Belanja <span className="text-red-500">*</span>
              </label>
              {isLocked("pekerjaan") && (
                <span className="text-[11px] text-emerald-800 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Tertaut dari Kontrak
                </span>
              )}
            </div>
            <textarea
              name="pekerjaan"
              rows={2}
              value={values.pekerjaan || ""}
              onChange={onChange}
              readOnly={isLocked("pekerjaan")}
              placeholder="Contoh: Belanja Kawat/Faksimili/Internet/TV Berlangganan..."
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-slate-900 transition-all resize-none ${
                isLocked("pekerjaan")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              }`}
              required
            />
          </div>

          {/* Program */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Program
              </label>
              {isLocked("program") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="program"
              value={values.program || ""}
              onChange={onChange}
              readOnly={isLocked("program")}
              placeholder="PROGRAM PENGELOLAAN PENDAPATAN DAERAH"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isLocked("program")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Kegiatan */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Kegiatan
              </label>
              {isLocked("kegiatan") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="kegiatan"
              value={values.kegiatan || ""}
              onChange={onChange}
              readOnly={isLocked("kegiatan")}
              placeholder="KEGIATAN PENGELOLAAN PENDAPATAN DAERAH"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isLocked("kegiatan")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Sub Kegiatan */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Sub Kegiatan <span className="text-red-500">*</span>
              </label>
              {isLocked("sub_kegiatan") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="sub_kegiatan"
              value={values.sub_kegiatan || ""}
              onChange={onChange}
              readOnly={isLocked("sub_kegiatan")}
              placeholder="Pelayanan dan Konsultasi Pajak Daerah"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isLocked("sub_kegiatan")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
              required
            />
          </div>

          {/* Kode Rekening */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Kode Rekening Belanja
              </label>
              {isLocked("kode_rekening") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="kode_rekening"
              value={values.kode_rekening || ""}
              onChange={onChange}
              readOnly={isLocked("kode_rekening")}
              placeholder="5.1.02.02.001.00063"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked("kode_rekening")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Tahun Anggaran */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tahun Anggaran
              </label>
              {isLocked("tahun_anggaran") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="tahun_anggaran"
              value={values.tahun_anggaran || "2026"}
              onChange={onChange}
              readOnly={isLocked("tahun_anggaran")}
              placeholder="2026"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked("tahun_anggaran")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Bagian Bulan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Bagian Bulan Rekap
              </label>
              {isLocked("bagian_bulan") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="bagian_bulan"
              value={values.bagian_bulan || ""}
              onChange={onChange}
              readOnly={isLocked("bagian_bulan")}
              placeholder="Oktober 2026"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isLocked("bagian_bulan")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Nomor DPA / DPPA */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nomor DPA / DPPA Lengkap
              </label>
              {isLocked("nomor_dpa") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="nomor_dpa"
              value={values.nomor_dpa || ""}
              onChange={onChange}
              readOnly={isLocked("nomor_dpa")}
              placeholder="DPPA/A.3/5.2.02.0.00.0.00.02.0000/001/2026"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked("nomor_dpa")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Jangka Waktu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Jangka Waktu (Hari)
              </label>
              {isLocked("days") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="days"
              value={values.days || "3"}
              onChange={onChange}
              readOnly={isLocked("days")}
              placeholder="3"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked("days")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Masa Pemeliharaan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Masa Pemeliharaan (Hari)
            </label>
            <input
              type="text"
              name="masa_pemeliharaan"
              value={values.masa_pemeliharaan || "3"}
              onChange={onChange}
              placeholder="3"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
