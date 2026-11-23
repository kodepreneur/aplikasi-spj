"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, TrendingDown, DollarSign, FileText } from "lucide-react";
import type { FormattedContractSummary } from "@/lib/domain/contract-calc";

interface ContractSummaryBarProps {
  summary: FormattedContractSummary;
  packageName?: string;
  providerType?: string;
  providerName?: string;
}

export function ContractSummaryBar({
  summary,
  packageName,
  providerType,
  providerName,
}: ContractSummaryBarProps) {
  const fullProvider = useMemo(() => {
    return [providerType, providerName].filter(Boolean).join(" ");
  }, [providerType, providerName]);

  const hasErrors = summary.errors.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header Info */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium text-slate-800 truncate text-sm">
            {packageName || "Paket Pengadaan Baru"}
          </span>
          {fullProvider && (
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono truncate">
              {fullProvider}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasErrors ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              {summary.errors.length} catatan validasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              RAB Valid ({summary.itemCount} item)
            </span>
          )}
        </div>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Pagu Anggaran
          </p>
          <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">
            Rp {summary.budget}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            Maksimum pagu pengadaan
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Total HPS (Awal + PPN)
          </p>
          <p className="text-lg font-bold text-slate-800 font-mono tracking-tight">
            Rp {summary.earlyTotal}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            Subtotal: Rp {summary.earlySubtotal} | PPN: Rp {summary.earlyVat}
          </p>
        </div>

        <div className="p-4 bg-emerald-50/40">
          <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider mb-1">
            Nilai Kontrak (Akhir + PPN)
          </p>
          <p className="text-lg font-bold text-emerald-900 font-mono tracking-tight">
            Rp {summary.finalTotal}
          </p>
          <p className="text-[11px] text-emerald-700 truncate mt-0.5">
            Subtotal: Rp {summary.finalSubtotal} | PPN: Rp {summary.finalVat}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            Efisiensi Anggaran
          </p>
          <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">
            Rp {summary.finalDiff}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            Sisa dari pagu anggaran
          </p>
        </div>
      </div>

      {/* Terbilang Nilai Kontrak */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700 shrink-0">Terbilang Kontrak:</span>
        <span className="italic text-slate-800 truncate">
          &ldquo;{summary.finalWords}&rdquo;
        </span>
      </div>
    </div>
  );
}
