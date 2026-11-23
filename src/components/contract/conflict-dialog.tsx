"use client";

import { AlertTriangle, Download, RefreshCw, X } from "lucide-react";

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadBackup: () => void;
  onReload: () => void;
  currentRevision?: number;
  documentType?: string;
}

export function ConflictDialog({
  isOpen,
  onClose,
  onDownloadBackup,
  onReload,
  currentRevision,
  documentType = "kontrak",
}: ConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              Konflik Revisi Dokumen
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Dokumen {documentType} ini telah diperbarui oleh pengguna lain di server.
              {currentRevision && (
                <span className="font-semibold text-slate-800">
                  {" "}Revisi server saat ini: #{currentRevision}.
                </span>
              )}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Untuk mencegah tertimpanya perubahan rekan Anda, simpan draf lokal Anda terlebih dahulu ke berkas cadangan JSON sebelum memuat ulang.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onDownloadBackup}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh Draf Saya (.json)
              </button>

              <button
                type="button"
                onClick={onReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Versi Server
              </button>
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
      </div>
    </div>
  );
}
