"use client";

import { Plus, Trash2, Layers, AlertCircle } from "lucide-react";
import { itemLetter, readDecimal, readMoney, rounded, money } from "@/lib/domain/contract-calc";

interface RabItem {
  name: string;
  unit: string;
  quantity: string | number;
  volume: string | number;
  earlyPrice: string | number;
  finalPrice?: string | number;
}

interface RabGroup {
  name: string;
  items: RabItem[];
}

interface RabSectionProps {
  groups: RabGroup[];
  onChangeGroups: (newGroups: RabGroup[]) => void;
  vatRate?: string;
  errors?: Record<string, string[]>;
}

export function RabSection({
  groups,
  onChangeGroups,
  vatRate = "11",
  errors,
}: RabSectionProps) {
  // Handlers for Group
  const addGroup = () => {
    const newGroups = [
      ...groups,
      {
        name: `Kelompok ${groups.length + 1}`,
        items: [
          {
            name: "",
            unit: "Kegiatan",
            quantity: "1",
            volume: "1",
            earlyPrice: "0",
            finalPrice: "",
          },
        ],
      },
    ];
    onChangeGroups(newGroups);
  };

  const removeGroup = (groupIndex: number) => {
    if (groups.length <= 1) {
      alert("Minimal harus ada 1 kelompok uraian pekerjaan.");
      return;
    }
    const newGroups = groups.filter((_, idx) => idx !== groupIndex);
    onChangeGroups(newGroups);
  };

  const updateGroupName = (groupIndex: number, name: string) => {
    const newGroups = groups.map((g, idx) => (idx === groupIndex ? { ...g, name } : g));
    onChangeGroups(newGroups);
  };

  // Handlers for Items
  const addItem = (groupIndex: number) => {
    const newGroups = groups.map((group, idx) => {
      if (idx !== groupIndex) return group;
      return {
        ...group,
        items: [
          ...group.items,
          {
            name: "",
            unit: "Orang/Kegiatan",
            quantity: "1",
            volume: "1",
            earlyPrice: "0",
            finalPrice: "",
          },
        ],
      };
    });
    onChangeGroups(newGroups);
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const group = groups[groupIndex];
    if (group.items.length <= 1) {
      alert("Kelompok minimal harus memiliki 1 item barang/jasa.");
      return;
    }
    const newGroups = groups.map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      return {
        ...g,
        items: g.items.filter((_, iIdx) => iIdx !== itemIndex),
      };
    });
    onChangeGroups(newGroups);
  };

  const updateItemField = (
    groupIndex: number,
    itemIndex: number,
    field: keyof RabItem,
    value: string
  ) => {
    const newGroups = groups.map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      const newItems = g.items.map((item, iIdx) => {
        if (iIdx !== itemIndex) return item;
        return { ...item, [field]: value };
      });
      return { ...g, items: newItems };
    });
    onChangeGroups(newGroups);
  };

  // Quick helper to compute item row subtotals for live UI preview
  const computeRowSubtotals = (item: RabItem) => {
    const qty = readDecimal(String(item.quantity));
    const vol = readDecimal(String(item.volume));
    const early = readMoney(String(item.earlyPrice));
    const final = (String(item.finalPrice ?? "").trim() === "")
      ? early
      : readMoney(String(item.finalPrice));

    if (!qty?.units || !vol?.units || early == null || final == null) {
      return { earlySub: 0n, finalSub: 0n };
    }

    const factor = qty.units * vol.units;
    const scale = qty.scale * vol.scale;
    const earlySub = rounded(factor * early, scale);
    const finalSub = rounded(factor * final, scale);
    return { earlySub, finalSub };
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Rencana Anggaran Biaya (RAB)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Susun kelompok pekerjaan dan uraian barang/jasa beserta harga negosiasi akhir.
          </p>
        </div>

        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelompok Baru
        </button>
      </div>

      {/* Group List */}
      {groups.map((group, groupIndex) => {
        let groupEarlyTotal = 0n;
        let groupFinalTotal = 0n;

        return (
          <div
            key={groupIndex}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
          >
            {/* Group Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {groupIndex + 1}
                </div>
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                  placeholder="Nama Kelompok Pekerjaan..."
                  className="font-semibold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-600 focus:outline-none px-1 py-0.5 w-full max-w-md"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addItem(groupIndex)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  Tambah Item
                </button>

                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(groupIndex)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="Hapus Kelompok"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Table of items */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Uraian Barang / Jasa</th>
                    <th className="py-2.5 px-3 w-32">Satuan</th>
                    <th className="py-2.5 px-3 w-20 text-right">QTY</th>
                    <th className="py-2.5 px-3 w-20 text-right">Volume</th>
                    <th className="py-2.5 px-3 w-36 text-right">Harga HPS (Rp)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Harga Kontrak (Rp)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total Kontrak</th>
                    <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((item, itemIndex) => {
                    const { earlySub, finalSub } = computeRowSubtotals(item);
                    groupEarlyTotal += earlySub;
                    groupFinalTotal += finalSub;

                    return (
                      <tr key={itemIndex} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono">
                          {itemLetter(itemIndex)}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItemField(groupIndex, itemIndex, "name", e.target.value)
                            }
                            placeholder="Nama / uraian spesifikasi..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              updateItemField(groupIndex, itemIndex, "unit", e.target.value)
                            }
                            placeholder="Paket / Bulan..."
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemField(groupIndex, itemIndex, "quantity", e.target.value)
                            }
                            placeholder="1"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-right text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.volume}
                            onChange={(e) =>
                              updateItemField(groupIndex, itemIndex, "volume", e.target.value)
                            }
                            placeholder="1"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-right text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.earlyPrice}
                            onChange={(e) =>
                              updateItemField(groupIndex, itemIndex, "earlyPrice", e.target.value)
                            }
                            placeholder="1.000.000"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-right text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.finalPrice ?? ""}
                            onChange={(e) =>
                              updateItemField(groupIndex, itemIndex, "finalPrice", e.target.value)
                            }
                            placeholder="Sama dgn HPS"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-right text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                          {money(finalSub)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {group.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(groupIndex, itemIndex)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
                    <td colSpan={5} className="py-2.5 px-3 text-right">
                      Subtotal {group.name || `Kelompok ${groupIndex + 1}`}:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {money(groupEarlyTotal)}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-emerald-800">
                      {money(groupFinalTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
