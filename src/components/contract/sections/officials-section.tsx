"use client";

import { useState, type ChangeEvent } from "react";
import { Users, UserCheck, Sparkles } from "lucide-react";
import { OfficialPickerModal } from "@/components/master/official-picker-modal";
import type { Official } from "@/lib/db/schema";

interface OfficialsSectionProps {
  data: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBatchChange?: (updates: Record<string, any>) => void;
}

export function OfficialsSection({ data, onChange, onBatchChange }: OfficialsSectionProps) {
  const [ppkPickerOpen, setPpkPickerOpen] = useState(false);
  const [procurementPickerOpen, setProcurementPickerOpen] = useState(false);

  const handleSelectPpk = (official: Official) => {
    const updates: Record<string, any> = {
      ppkName: official.name,
      ppkPlanningNip: official.nip,
      ppkSpkNip: official.nip,
    };
    if (official.skNumber && !data.decisionNumber) {
      updates.decisionNumber = official.skNumber;
    }
    if (official.skDate && !data.decisionDate) {
      updates.decisionDate = official.skDate;
    }

    if (onBatchChange) {
      onBatchChange(updates);
    } else {
      for (const [k, v] of Object.entries(updates)) {
        onChange({ target: { name: k, value: v } } as any);
      }
    }
  };

  const handleSelectProcurement = (official: Official) => {
    const updates: Record<string, any> = {
      procurementName: official.name,
      procurementNip: official.nip,
    };

    if (onBatchChange) {
      onBatchChange(updates);
    } else {
      for (const [k, v] of Object.entries(updates)) {
        onChange({ target: { name: k, value: v } } as any);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* SK Pengangkatan Pejabat */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Surat Keputusan Pengangkatan
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Dasar hukum pengangkatan Pejabat Pembuat Komitmen dan Pejabat Pengadaan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor SK Pengangkatan
            </label>
            <input
              type="text"
              name="decisionNumber"
              value={data.decisionNumber || ""}
              onChange={onChange}
              placeholder="Contoh: 188.45/01/1.12/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal SK Pengangkatan
            </label>
            <input
              type="date"
              name="decisionDate"
              value={data.decisionDate || ""}
              onChange={onChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Pejabat Pembuat Komitmen (PPK) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Pejabat Pembuat Komitmen (PPK)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas PPK perencana pengadaan dan penandatangan kontrak SPK.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPpkPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Pilih PPK dari Master Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap PPK
            </label>
            <input
              type="text"
              name="ppkName"
              value={data.ppkName || ""}
              onChange={onChange}
              placeholder="HADI JAYA, S.Sos., M.Si."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP PPK (Tahap Perencanaan)
            </label>
            <input
              type="text"
              name="ppkPlanningNip"
              value={data.ppkPlanningNip || ""}
              onChange={onChange}
              placeholder="19750101 200003 1 005"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP PPK (Tahap SPK / Kontrak)
            </label>
            <input
              type="text"
              name="ppkSpkNip"
              value={data.ppkSpkNip || ""}
              onChange={onChange}
              placeholder="19750101 200003 1 005"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Pejabat Pengadaan */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-800" />
              <h3 className="text-base font-semibold text-slate-900">
                Pejabat Pengadaan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pejabat fungsional / pengadaan yang melaksanakan negosiasi teknis dan harga.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setProcurementPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pilih Pengadaan dari Master Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Pejabat Pengadaan
            </label>
            <input
              type="text"
              name="procurementName"
              value={data.procurementName || ""}
              onChange={onChange}
              placeholder="BUDI SANTOSO, S.E."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP Pejabat Pengadaan
            </label>
            <input
              type="text"
              name="procurementNip"
              value={data.procurementNip || ""}
              onChange={onChange}
              placeholder="19820512 201001 1 012"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Pickers */}
      <OfficialPickerModal
        isOpen={ppkPickerOpen}
        onClose={() => setPpkPickerOpen(false)}
        onSelect={handleSelectPpk}
        targetRole="PA_PPK"
        title="Pilih Pejabat Pembuat Komitmen (PPK)"
        selectedName={data.ppkName}
      />

      <OfficialPickerModal
        isOpen={procurementPickerOpen}
        onClose={() => setProcurementPickerOpen(false)}
        onSelect={handleSelectProcurement}
        targetRole="PEJABAT_PENGADAAN"
        title="Pilih Pejabat Pengadaan"
        selectedName={data.procurementName}
      />
    </div>
  );
}
