"use client";

import type { ChangeEvent } from "react";

interface IdentitySectionProps {
  data: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors?: Record<string, string[]>;
}

export function IdentitySection({ data, onChange, errors }: IdentitySectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Identitas Paket & Anggaran
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Informasi pokok pengadaan barang/jasa langsung Bapenda Jember.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Nama Paket */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Paket Pengadaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="packageName"
              value={data.packageName || ""}
              onChange={onChange}
              placeholder="Contoh: Jasa Penyelenggaraan Acara Studi Tiru"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              required
            />
            {errors?.packageName && (
              <p className="text-xs text-red-600 mt-1">{errors.packageName[0]}</p>
            )}
          </div>

          {/* Pagu Anggaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pagu Anggaran (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="budget"
              value={data.budget || ""}
              onChange={onChange}
              placeholder="Contoh: 100.000.000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              required
            />
            {errors?.budget && (
              <p className="text-xs text-red-600 mt-1">{errors.budget[0]}</p>
            )}
          </div>

          {/* Tarif PPN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tarif PPN (%)
            </label>
            <div className="flex gap-2">
              {["11", "12", "0"].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() =>
                    onChange({
                      target: { name: "vatRate", value: rate },
                    } as any)
                  }
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    (data.vatRate || "11") === rate
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Tahun Anggaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tahun Anggaran
            </label>
            <input
              type="text"
              name="fiscalYear"
              value={data.fiscalYear || "2026"}
              onChange={onChange}
              placeholder="2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Kode Rekening */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kode Rekening Belanja
            </label>
            <input
              type="text"
              name="accountCode"
              value={data.accountCode || ""}
              onChange={onChange}
              placeholder="5.1.02.02.01.00047"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Bulan Pembayaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Bulan Pembayaran
            </label>
            <input
              type="text"
              name="paymentMonth"
              value={data.paymentMonth || ""}
              onChange={onChange}
              placeholder="Contoh: Oktober"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Tambahan Sampul */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan Sampul (Opsional)
            </label>
            <input
              type="text"
              name="coverAddition"
              value={data.coverAddition || ""}
              onChange={onChange}
              placeholder="Kegiatan Studi Tiru dan Focus Group Discussion"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Program */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Program
            </label>
            <input
              type="text"
              name="program"
              value={data.program || ""}
              onChange={onChange}
              placeholder="PENGELOLAAN PENDAPATAN DAERAH"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Kegiatan */}
          <div className="md:col-span-1 lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kegiatan
            </label>
            <input
              type="text"
              name="activity"
              value={data.activity || ""}
              onChange={onChange}
              placeholder="PENGELOLAAN PENDAPATAN DAERAH"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Subkegiatan */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Subkegiatan
            </label>
            <input
              type="text"
              name="subactivity"
              value={data.subactivity || ""}
              onChange={onChange}
              placeholder="Analisa dan Pengembangan Pajak Daerah..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Ruang Lingkup */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ruang Lingkup Pekerjaan
            </label>
            <textarea
              name="scope"
              rows={2}
              value={data.scope || ""}
              onChange={onChange}
              placeholder="Penyelenggaraan Acara Studi Tiru dan Focus Group Discussion..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Dokumen Pelaksanaan & Jadwal */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          DPPA & Periode Pelaksanaan
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Dasar anggaran DPPA dan rentang waktu pelaksanaan pekerjaan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Nomor DPPA */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor DPPA
            </label>
            <input
              type="text"
              name="dppaNumber"
              value={data.dppaNumber || ""}
              onChange={onChange}
              placeholder="DPPA/A.1/5.02.0.00.0.00.01.0000/001/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Tanggal DPPA */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal DPPA
            </label>
            <input
              type="date"
              name="dppaDate"
              value={data.dppaDate || ""}
              onChange={onChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Mulai Pelaksanaan */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Awal Pelaksanaan
            </label>
            <input
              type="date"
              name="workStart"
              value={data.workStart || ""}
              onChange={onChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Selesai Pelaksanaan */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Akhir Pelaksanaan
            </label>
            <input
              type="date"
              name="workEnd"
              value={data.workEnd || ""}
              onChange={onChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
