"use client";

import { useState, type ChangeEvent } from "react";
import { Building2, Sparkles, CheckCheck, BookmarkPlus } from "lucide-react";
import { ProviderPickerModal } from "@/components/master/provider-picker-modal";
import { saveProviderAction } from "@/app/actions/providers";
import type { Provider } from "@/lib/db/schema";

interface ProviderSectionProps {
  data: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBatchChange?: (updates: Record<string, any>) => void;
  errors?: Record<string, string[]>;
}

export function ProviderSection({ data, onChange, onBatchChange, errors }: ProviderSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectProvider = (p: Provider) => {
    if (onBatchChange) {
      onBatchChange({
        providerType: p.type,
        providerName: p.name,
        signatory: p.director,
        npwp: p.npwp,
        providerPhone: p.phone,
        address: p.address,
      });
    } else {
      const fields = [
        { name: "providerType", value: p.type },
        { name: "providerName", value: p.name },
        { name: "signatory", value: p.director },
        { name: "npwp", value: p.npwp },
        { name: "providerPhone", value: p.phone },
        { name: "address", value: p.address },
      ];
      for (const f of fields) {
        onChange({
          target: { name: f.name, value: f.value },
        } as any);
      }
    }
  };

  const handleSaveToMaster = async () => {
    if (!data.providerName?.trim()) {
      alert("Masukkan nama rekanan terlebih dahulu sebelum menyimpan ke Master Data.");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await saveProviderAction({
        name: data.providerName,
        type: data.providerType || "CV",
        director: data.signatory || "",
        npwp: data.npwp || "",
        phone: data.providerPhone || "",
        address: data.address || "",
      });

      if (res.success) {
        setSaveStatus("Tersimpan di Master Data");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan ke Master Data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Section Header with Master Data Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-semibold text-slate-900">
              Penyedia &amp; Rekanan Pelaksana
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Data profil rekanan, pimpinan berwenang, dan alamat surat-menyurat pengadaan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveStatus ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <CheckCheck className="w-3.5 h-3.5" /> {saveStatus}
            </span>
          ) : (
            data.providerName?.trim() && (
              <button
                type="button"
                onClick={handleSaveToMaster}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Simpan data rekanan yang diketik ini ke Master Data agar bisa dipakai lagi"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan ke Master Data</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pilih dari Master Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Bentuk Usaha */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Bentuk Usaha
          </label>
          <select
            name="providerType"
            value={data.providerType || "CV"}
            onChange={onChange}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          >
            <option value="CV">CV</option>
            <option value="PT">PT</option>
            <option value="UD">UD</option>
            <option value="Koperasi">Koperasi</option>
            <option value="Perorangan">Perorangan</option>
          </select>
        </div>

        {/* Nama Perusahaan */}
        <div className="md:col-span-1 lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Nama Perusahaan / Rekanan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="providerName"
            value={data.providerName || ""}
            onChange={onChange}
            placeholder="LUNA SENTOSA GEMILANG INDONESIA"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            required
          />
          {errors?.providerName && (
            <p className="text-xs text-red-600 mt-1">{errors.providerName[0]}</p>
          )}
        </div>

        {/* Nama Pimpinan / Penandatangan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Nama Pimpinan / Direktur
          </label>
          <input
            type="text"
            name="signatory"
            value={data.signatory || ""}
            onChange={onChange}
            placeholder="LUSI ANGGRAENI SEMBIRING"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

        {/* NPWP */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            NPWP Perusahaan
          </label>
          <input
            type="text"
            name="npwp"
            value={data.npwp || ""}
            onChange={onChange}
            placeholder="71.746.501.7-626.000"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Telepon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Nomor Telepon / Kontak
          </label>
          <input
            type="text"
            name="providerPhone"
            value={data.providerPhone || ""}
            onChange={onChange}
            placeholder="081234567890"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Alamat Lengkap */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Alamat Kantor Perusahaan
          </label>
          <textarea
            name="address"
            rows={2}
            value={data.address || ""}
            onChange={onChange}
            placeholder="JALAN SUMATRA NOMOR 82B, JEMBER"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Modal Picker */}
      <ProviderPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectProvider}
        selectedName={data.providerName}
      />
    </div>
  );
}
