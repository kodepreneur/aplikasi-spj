"use client";

import { History, X, Clock, UserCheck } from "lucide-react";
import type { Event } from "@/lib/db/schema";

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  currentRevision: number;
}

export function HistoryDialog({
  isOpen,
  onClose,
  events,
  currentRevision,
}: HistoryDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Perubahan Dokumen
              </h3>
              <p className="text-[11px] text-slate-500">
                Audit trail lengkap revisi #{currentRevision}
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

        <div className="mt-4 max-h-[380px] overflow-y-auto pr-1 space-y-3">
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Belum ada riwayat tercatat.
            </p>
          ) : (
            events.map((evt, idx) => {
              const isLatest = idx === events.length - 1;
              const dateStr = new Date(evt.at).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              const actionLabels: Record<string, { label: string; color: string }> = {
                created: { label: "Dibuat", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                edited: { label: "Diubah", color: "bg-blue-50 text-blue-800 border-blue-200" },
                deleted: { label: "Dihapus", color: "bg-red-50 text-red-800 border-red-200" },
                imported: { label: "Diimpor", color: "bg-purple-50 text-purple-800 border-purple-200" },
              };

              const actionInfo = actionLabels[evt.action] || {
                label: evt.action,
                color: "bg-slate-50 text-slate-700 border-slate-200",
              };

              return (
                <div
                  key={evt.seq}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isLatest
                      ? "bg-slate-50 border-slate-200 shadow-2xs"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${actionInfo.color}`}
                    >
                      {actionInfo.label}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900">{evt.actorName}</span>
                    {evt.legacy === 1 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-mono">
                        legacy
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
