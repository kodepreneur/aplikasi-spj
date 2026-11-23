"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Receipt, Coins, DollarSign } from "lucide-react";
import type { SpendingResult, PphCalculationResult } from "@/lib/domain/tax-calc";

interface SpjSummaryBarProps {
  spending: SpendingResult;
  pph: PphCalculationResult;
  net: number;
  terbilangWords?: string;
  errors: string[];
  title?: string;
  providerName?: string;
}

const numberFormat = new Intl.NumberFormat("id-ID");

export function SpjSummaryBar({
  spending,
  pph,
  net,
  terbilangWords,
  errors,
  title,
  providerName,
}: SpjSummaryBarProps) {
  const hasErrors = errors.length > 0;

  const totalFormatted = useMemo(() => {
    return Number.isFinite(spending.total) ? numberFormat.format(spending.total) : "0";
  }, [spending.total]);

  const baseFormatted = useMemo(() => {
    return Number.isFinite(spending.base) ? numberFormat.format(spending.base) : "0";
  }, [spending.base]);

  const ppnFormatted = useMemo(() => {
    return Number.isFinite(spending.ppn) ? numberFormat.format(spending.ppn) : "0";
  }, [spending.ppn]);

  const pphFormatted = useMemo(() => {
    return Number.isFinite(pph.amount) ? numberFormat.format(pph.amount) : "0";
  }, [pph.amount]);

  const netFormatted = useMemo(() => {
    return Number.isFinite(net) ? numberFormat.format(net) : "0";
  }, [net]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Top Info Bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Receipt className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold text-slate-800 truncate text-sm">
            {title || "Dokumen SPJ Baru"}
          </span>
          {providerName && (
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono truncate">
              {providerName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasErrors ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.length} catatan validasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kalkulasi Valid ({spending.items.length} belanja)
            </span>
          )}
        </div>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Total Bruto
          </p>
          <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">
            Rp {totalFormatted}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Nilai kuitansi bruto
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Dasar Pajak (DPP)
          </p>
          <p className="text-lg font-bold text-slate-800 font-mono tracking-tight">
            Rp {baseFormatted}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sebelum pengenaan pajak
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Potongan PPN ({spending.rate}%)
          </p>
          <p className="text-lg font-bold text-slate-800 font-mono tracking-tight">
            Rp {ppnFormatted}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pajak Pertambahan Nilai
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Potongan {pph.label} ({pph.rate}%)
          </p>
          <p className="text-lg font-bold text-slate-800 font-mono tracking-tight">
            Rp {pphFormatted}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pajak Penghasilan
          </p>
        </div>

        <div className="p-4 bg-emerald-50/50 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            Nilai Netto Diterima
          </p>
          <p className="text-lg font-bold text-emerald-900 font-mono tracking-tight">
            Rp {netFormatted}
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            Ditransfer ke rekanan
          </p>
        </div>
      </div>

      {/* Terbilang Nilai Total Bruto */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700 shrink-0">Terbilang Bruto:</span>
        <span className="italic text-slate-800 truncate">
          &ldquo;{terbilangWords || "Nol rupiah"}&rdquo;
        </span>
      </div>
    </div>
  );
}
