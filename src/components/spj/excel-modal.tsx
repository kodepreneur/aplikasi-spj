"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, X, Calendar } from "lucide-react";

interface ExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableYears?: string[];
}

export function ExcelModal({
  isOpen,
  onClose,
  availableYears = ["2026", "2025", "2024"],
}: ExcelModalProps) {
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    const query = selectedYear === "all" ? "" : `?year=${selectedYear}`;
    const url = `/api/export/excel/spj${query}`;

    // Create hidden link to trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-spj-${selectedYear}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Unduh Rekapitulasi SPJ (Excel)
              </h3>
              <p className="text-[11px] text-slate-500">
                Format standar rekapitulasi belanja Bapenda Jember
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Tahun Anggaran
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all cursor-pointer font-medium"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun Anggaran {yr}
                  </option>
                ))}
                <option value="all">Semua Tahun Anggaran</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Isi Kolom Rekapitulasi:</span>
            </div>
            <p className="text-[11px] text-slate-500">
              No · OPD · Pekerjaan / Belanja · Total Bruto · Nomor SPK · Tanggal SPK · Tanggal Selesai · Rekanan Penyedia · PA/PPK · PPTK
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-800/60 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? "Mengunduh..." : "Unduh Berkas Excel"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
