"use client";

import { useState } from "react";
import { Link2, AlertTriangle, RefreshCw, Archive, CheckCircle2, X, Lock } from "lucide-react";
import type { SpjSourceSnapshot, SourceStatus } from "@/lib/domain/link-mapper";
import { LINKED_FIELDS } from "@/lib/domain/link-mapper";

interface SpjSourceBannerProps {
  source: SpjSourceSnapshot | null;
  status: SourceStatus;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function SpjSourceBanner({
  source,
  status,
  onSync,
  isSyncing = false,
}: SpjSourceBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!source) return null;

  return (
    <>
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
          status === "changed"
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : status === "deleted"
            ? "bg-slate-100 border-slate-300 text-slate-800"
            : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              status === "changed"
                ? "bg-amber-200 text-amber-800"
                : status === "deleted"
                ? "bg-slate-200 text-slate-700"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {status === "changed" ? (
              <AlertTriangle className="w-5 h-5 text-amber-700 animate-pulse" />
            ) : status === "deleted" ? (
              <Archive className="w-5 h-5 text-slate-600" />
            ) : (
              <Link2 className="w-5 h-5 text-emerald-700" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs uppercase tracking-wider">
                {status === "changed"
                  ? "Kontrak Sumber Diperbarui"
                  : status === "deleted"
                  ? "Kontrak Sumber Telah Dihapus (Salinan Beku)"
                  : "Tertaut ke Kontrak Manual"}
              </span>
              <span className="text-[11px] font-mono bg-white/80 border px-2 py-0.5 rounded">
                SPK: {source.spk || "-"}
              </span>
              <span className="text-[11px] font-mono bg-white/80 border px-2 py-0.5 rounded">
                Revisi #{source.revision}
              </span>
            </div>

            <p className="text-xs mt-1 leading-relaxed">
              {status === "changed"
                ? "Kontrak sumber telah dimodifikasi setelah SPJ ini dibuat. Unduhan Word dikunci sampai Anda memperbarui data dari kontrak."
                : status === "deleted"
                ? "Kontrak sumber telah dihapus. Data SPJ tetap aman menggunakan snapshot beku (freeze snapshot)."
                : `Data penyedia, nomor SPK, dan rincian belanja tersinkronisasi otomatis dari "${source.title}".`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            Lihat Data Tertaut
          </button>

          {status === "changed" && onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Menyinkronkan..." : "Perbarui dari Kontrak"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal View Linked Fields */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Field Tertaut Otomatis dari Kontrak
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Field berikut dikunci pada formulir SPJ karena dikelola langsung oleh Kontrak Pengadaan sumber:
            </p>

            <div className="mt-4 max-h-[300px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {Object.entries(LINKED_FIELDS).map(([key, label]) => (
                <div key={key} className="p-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="text-[11px] font-mono text-slate-400">{key}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
