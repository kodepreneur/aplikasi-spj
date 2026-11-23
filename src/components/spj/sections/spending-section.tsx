"use client";

import { useMemo } from "react";
import { Plus, Trash2, Lock, Percent, Calculator } from "lucide-react";
import type { SpjItemInput, SpendingResult, PphCalculationResult } from "@/lib/domain/tax-calc";
import { PPH_DEFAULT_RATES } from "@/lib/domain/tax-calc";

interface SpendingSectionProps {
  items: SpjItemInput[];
  onChangeItems: (newItems: SpjItemInput[]) => void;
  priceBasis: string;
  onChangePriceBasis: (basis: "included" | "excluded") => void;
  vatRate: string;
  onChangeVatRate: (rate: string) => void;
  pphType: string;
  onChangePphType: (type: string) => void;
  pphRate: string;
  onChangePphRate: (rate: string) => void;
  spending: SpendingResult;
  pph: PphCalculationResult;
  isLinked?: boolean;
}

const numberFormat = new Intl.NumberFormat("id-ID");

export function SpendingSection({
  items,
  onChangeItems,
  priceBasis = "included",
  onChangePriceBasis,
  vatRate = "11",
  onChangeVatRate,
  pphType = "23",
  onChangePphType,
  pphRate = "2",
  onChangePphRate,
  spending,
  pph,
  isLinked = false,
}: SpendingSectionProps) {
  const addItem = () => {
    onChangeItems([
      ...items,
      {
        description: "",
        detail: "",
        unit: "Paket",
        quantity: "1",
        unitPrice: "0",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      alert("Minimal harus ada 1 baris rincian belanja.");
      return;
    }
    onChangeItems(items.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: keyof SpjItemInput, value: string) => {
    const updated = items.map((it, idx) => (idx === index ? { ...it, [field]: value } : it));
    onChangeItems(updated);
  };

  const handlePphTypeSelect = (type: string) => {
    onChangePphType(type);
    if (PPH_DEFAULT_RATES[type] !== undefined) {
      onChangePphRate(PPH_DEFAULT_RATES[type]!);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Pengaturan Pajak (PPN & PPh) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Pengaturan Pajak (PPN &amp; PPh)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Tentukan perlakuan basis harga terhadap PPN dan potongan Pajak Penghasilan (PPh).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basis Harga */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Basis Harga terhadap PPN
              </label>
              {isLinked && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLinked}
                onClick={() => onChangePriceBasis("excluded")}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                  priceBasis === "excluded"
                    ? "bg-emerald-800 text-white border-emerald-800"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                } ${isLinked ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
              >
                Belum Termasuk PPN (Excluded)
              </button>

              <button
                type="button"
                disabled={isLinked}
                onClick={() => onChangePriceBasis("included")}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                  priceBasis === "included"
                    ? "bg-emerald-800 text-white border-emerald-800"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                } ${isLinked ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
              >
                Sudah Termasuk PPN (Included)
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {priceBasis === "excluded"
                ? "Total kuitansi = DPP + PPN 11%"
                : "Total kuitansi = harga tertera (PPN dihitung dari dalam)"}
            </p>
          </div>

          {/* Tarif PPN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tarif PPN (%)
              </label>
              {isLinked && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>

            <div className="flex gap-2">
              {["11", "12", "0"].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  disabled={isLinked}
                  onClick={() => onChangeVatRate(rate)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    vatRate === rate
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  } ${isLinked ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">Tarif baku PPN daerah</p>
          </div>

          {/* Jenis & Tarif PPh */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Jenis Potongan PPh
            </label>

            <div className="flex gap-2">
              <select
                value={pphType}
                onChange={(e) => handlePphTypeSelect(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="23">PPh 23 (Jasa / Sewa - 2%)</option>
                <option value="22">PPh 22 (Barang - 1,5%)</option>
                <option value="21">PPh 21 (Narasumber - 5%)</option>
                <option value="final">PPh Final (UMKM - 0,5%)</option>
                <option value="none">Tanpa PPh (0%)</option>
              </select>

              {pphType !== "none" && (
                <div className="w-20 relative">
                  <input
                    type="text"
                    value={pphRate}
                    onChange={(e) => onChangePphRate(e.target.value)}
                    placeholder="2"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-center text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Dasar PPh dihitung dari nilai sebelum PPN (DPP)
            </p>
          </div>
        </div>
      </div>

      {/* 2. Rincian Belanja SPJ */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Rincian Belanja &amp; Kuitansi ({items.length} Item)
            </h3>
            <p className="text-xs text-slate-500">
              {isLinked
                ? "Daftar belanja disinkronkan otomatis dari RAB Kontrak Pengadaan."
                : "Masukkan daftar barang atau jasa yang dibayarkan pada kuitansi ini."}
            </p>
          </div>

          {!isLinked && (
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Belanja</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 min-w-[200px]">Uraian Pekerjaan / Belanja</th>
                <th className="py-2.5 px-3 min-w-[160px]">Keterangan Tambahan</th>
                <th className="py-2.5 px-3 w-28">Satuan</th>
                <th className="py-2.5 px-3 w-20 text-right">Vol / QTY</th>
                <th className="py-2.5 px-3 w-32 text-right">Harga Satuan (Rp)</th>
                <th className="py-2.5 px-3 w-32 text-right">Total (Rp)</th>
                {!isLinked && <th className="py-2.5 px-3 w-12 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const computed = spending.items[idx];
                const itemTotal = computed?.total
                  ? numberFormat.format(computed.total)
                  : "0";

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    {/* Uraian */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        readOnly={isLinked}
                        placeholder="Nama barang / jasa..."
                        className={`w-full px-2 py-1.5 border rounded-md text-xs transition-all ${
                          isLinked
                            ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                    </td>

                    {/* Keterangan */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.detail || ""}
                        onChange={(e) => updateItem(idx, "detail", e.target.value)}
                        readOnly={isLinked}
                        placeholder="Rincian..."
                        className={`w-full px-2 py-1.5 border rounded-md text-xs transition-all ${
                          isLinked
                            ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                    </td>

                    {/* Satuan */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.unit || ""}
                        onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        readOnly={isLinked}
                        placeholder="Paket / Bulan..."
                        className={`w-full px-2 py-1.5 border rounded-md text-xs transition-all ${
                          isLinked
                            ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                    </td>

                    {/* QTY */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        readOnly={isLinked}
                        placeholder="1"
                        className={`w-full px-2 py-1.5 border rounded-md text-xs font-mono text-right transition-all ${
                          isLinked
                            ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                    </td>

                    {/* Harga Satuan */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        readOnly={isLinked}
                        placeholder="1.000.000"
                        className={`w-full px-2 py-1.5 border rounded-md text-xs font-mono text-right transition-all ${
                          isLinked
                            ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                    </td>

                    {/* Total Baris */}
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                      Rp {itemTotal}
                    </td>

                    {/* Aksi */}
                    {!isLinked && (
                      <td className="py-2 px-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
                <td colSpan={4} className="py-2.5 px-3 text-right">
                  Total Nilai Bruto Belanja:
                </td>
                <td colSpan={3} className="py-2.5 px-3 text-right font-mono text-emerald-800 font-bold">
                  Rp {numberFormat.format(spending.total || 0)}
                </td>
                {!isLinked && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
