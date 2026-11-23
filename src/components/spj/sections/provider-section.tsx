"use client";

import { useState, type ChangeEvent } from "react";
import { Lock, Building2, Sparkles, CheckCheck, BookmarkPlus } from "lucide-react";
import { LINKED_FIELDS } from "@/lib/domain/link-mapper";
import { ProviderPickerModal } from "@/components/master/provider-picker-modal";
import { saveProviderAction } from "@/app/actions/providers";
import type { Provider } from "@/lib/db/schema";

interface ProviderSectionProps {
  values: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBatchChange?: (updates: Record<string, any>) => void;
  isLinked?: boolean;
}

export function ProviderSection({
  values,
  onChange,
  onBatchChange,
  isLinked = false,
}: ProviderSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isLocked = (key: string) => isLinked && Boolean(LINKED_FIELDS[key]);

  const handleSelectProvider = (p: Provider) => {
    const formattedType = p.type.endsWith(".") ? p.type : p.type + ".";
    const updates: Record<string, any> = {
      bentuk_usaha: formattedType,
      nama_penyedia: p.name,
      wakil_penyedia: p.director,
      jabatan_penyedia: p.position || "DIREKTUR",
      jabatan_penyedia_bayar: p.paymentPosition || "DIREKTUR",
      npwp: p.npwp,
      bank: p.bankName || "Bank Jatim",
      rekening_bank: p.bankAccount,
      alamat_penyedia: p.address,
    };

    if (onBatchChange) {
      onBatchChange(updates);
    } else {
      for (const [k, v] of Object.entries(updates)) {
        onChange({ target: { name: k, value: v } } as any);
      }
    }
  };

  const handleSaveToMaster = async () => {
    if (!values.nama_penyedia?.trim()) {
      alert("Masukkan nama rekanan terlebih dahulu sebelum menyimpan ke Master Data.");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const rawType = (values.bentuk_usaha || "CV").replace(/\.$/, "") as any;
      const res = await saveProviderAction({
        name: values.nama_penyedia,
        type: ["CV", "PT", "UD", "Koperasi", "Perorangan"].includes(rawType) ? rawType : "CV",
        director: values.wakil_penyedia || "",
        npwp: values.npwp || "",
        address: values.alamat_penyedia || "",
        position: values.jabatan_penyedia || "DIREKTUR",
        paymentPosition: values.jabatan_penyedia_bayar || "DIREKTUR",
        bankName: values.bank || "Bank Jatim",
        bankAccount: values.rekening_bank || "",
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
      {/* Header with Master Data Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-semibold text-slate-900">
              Penyedia, Rekanan &amp; Rekening Bank
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi pimpinan rekanan penerima pembayaran dan nomor rekening bank pencairan.
          </p>
        </div>

        {!isLinked && (
          <div className="flex items-center gap-2 shrink-0">
            {saveStatus ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
                <CheckCheck className="w-3.5 h-3.5" /> {saveStatus}
              </span>
            ) : (
              values.nama_penyedia?.trim() && (
                <button
                  type="button"
                  onClick={handleSaveToMaster}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title="Simpan data rekanan ini ke Master Data agar bisa dipakai lagi"
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
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Bentuk Badan Usaha */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Bentuk Usaha
            </label>
            {isLocked("bentuk_usaha") && <Lock className="w-3 h-3 text-emerald-800" />}
          </div>
          <select
            name="bentuk_usaha"
            value={values.bentuk_usaha || "CV."}
            onChange={onChange}
            disabled={isLocked("bentuk_usaha")}
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
              isLocked("bentuk_usaha")
                ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            }`}
          >
            <option value="CV.">CV.</option>
            <option value="PT.">PT.</option>
            <option value="UD.">UD.</option>
            <option value="Koperasi">Koperasi</option>
            <option value="Perorangan">Perorangan</option>
          </select>
        </div>

        {/* Nama Penyedia */}
        <div className="md:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Nama Perusahaan (Tanpa Awalan CV/PT) <span className="text-red-500">*</span>
            </label>
            {isLocked("nama_penyedia") && <Lock className="w-3 h-3 text-emerald-800" />}
          </div>
          <input
            type="text"
            name="nama_penyedia"
            value={values.nama_penyedia || ""}
            onChange={onChange}
            readOnly={isLocked("nama_penyedia")}
            placeholder="GLOBALTECH USAHA SEJAHTERA"
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
              isLocked("nama_penyedia")
                ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            }`}
            required
          />
        </div>

        {/* Nama Wakil Penyedia */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Nama Penandatangan Rekanan <span className="text-red-500">*</span>
            </label>
            {isLocked("wakil_penyedia") && <Lock className="w-3 h-3 text-emerald-800" />}
          </div>
          <input
            type="text"
            name="wakil_penyedia"
            value={values.wakil_penyedia || ""}
            onChange={onChange}
            readOnly={isLocked("wakil_penyedia")}
            placeholder="HADI MARTA DWINATA"
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
              isLocked("wakil_penyedia")
                ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            }`}
            required
          />
        </div>

        {/* Jabatan BA & Kuitansi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Jabatan pada BA &amp; Kuitansi
          </label>
          <input
            type="text"
            name="jabatan_penyedia"
            value={values.jabatan_penyedia || "PEMILIK"}
            onChange={onChange}
            placeholder="PEMILIK / DIREKTUR"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Jabatan Surat Bayar */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Jabatan Surat Bayar
          </label>
          <input
            type="text"
            name="jabatan_penyedia_bayar"
            value={values.jabatan_penyedia_bayar || "DIREKTUR"}
            onChange={onChange}
            placeholder="DIREKTUR"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* NPWP */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              NPWP Penyedia
            </label>
            {isLocked("npwp") && <Lock className="w-3 h-3 text-emerald-800" />}
          </div>
          <input
            type="text"
            name="npwp"
            value={values.npwp || ""}
            onChange={onChange}
            readOnly={isLocked("npwp")}
            placeholder="1000.0000.0328.1156"
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
              isLocked("npwp")
                ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            }`}
          />
        </div>

        {/* Bank */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Bank Tujuan Pencairan
          </label>
          <input
            type="text"
            name="bank"
            value={values.bank || "Bank Jatim"}
            onChange={onChange}
            placeholder="Bank Jatim"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Nomor Rekening Bank */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Nomor Rekening Bank
          </label>
          <input
            type="text"
            name="rekening_bank"
            value={values.rekening_bank || ""}
            onChange={onChange}
            placeholder="0031019575"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Alamat Penyedia */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Alamat Lengkap Perusahaan
            </label>
            {isLocked("alamat_penyedia") && <Lock className="w-3 h-3 text-emerald-800" />}
          </div>
          <textarea
            name="alamat_penyedia"
            rows={2}
            value={values.alamat_penyedia || ""}
            onChange={onChange}
            readOnly={isLocked("alamat_penyedia")}
            placeholder="ISTANA KALIWATES RESIDENCE C26 MANGLI - KALIWATES"
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all resize-none ${
              isLocked("alamat_penyedia")
                ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            }`}
          />
        </div>
      </div>

      {/* Modal Picker */}
      <ProviderPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectProvider}
        selectedName={values.nama_penyedia}
      />
    </div>
  );
}
