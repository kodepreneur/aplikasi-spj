"use client";

import { useState, type ChangeEvent } from "react";
import { Lock, Hash, Users, ShieldCheck, UserCheck, Sparkles } from "lucide-react";
import { LINKED_FIELDS } from "@/lib/domain/link-mapper";
import { OfficialPickerModal } from "@/components/master/official-picker-modal";
import type { Official } from "@/lib/db/schema";

interface OfficialsSectionProps {
  values: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBatchChange?: (updates: Record<string, any>) => void;
  isLinked?: boolean;
}

export function OfficialsSection({
  values,
  onChange,
  onBatchChange,
  isLinked = false,
}: OfficialsSectionProps) {
  const isLocked = (key: string) => isLinked && Boolean(LINKED_FIELDS[key]);

  const [paPickerOpen, setPaPickerOpen] = useState(false);
  const [pptkPickerOpen, setPptkPickerOpen] = useState(false);
  const [bendaharaPickerOpen, setBendaharaPickerOpen] = useState(false);
  const [asetPickerOpen, setAsetPickerOpen] = useState(false);

  const applyUpdates = (updates: Record<string, any>) => {
    if (onBatchChange) {
      onBatchChange(updates);
    } else {
      for (const [k, v] of Object.entries(updates)) {
        onChange({ target: { name: k, value: v } } as any);
      }
    }
  };

  const handleSelectPa = (official: Official) => {
    const updates: Record<string, any> = {
      nama_pa: official.name,
      nip_pa: official.nip,
      pangkat_pa: official.pangkat,
    };
    if (official.skNumber && !values.sk_pa_nomor) {
      updates.sk_pa_nomor = official.skNumber;
    }
    applyUpdates(updates);
  };

  const handleSelectPptk = (official: Official) => {
    const updates: Record<string, any> = {
      nama_pptk: official.name,
      nip_pptk: official.nip,
      pangkat_pptk: official.pangkat,
    };
    if (official.skNumber && !values.sk_pptk_nomor) {
      updates.sk_pptk_nomor = official.skNumber;
    }
    applyUpdates(updates);
  };

  const handleSelectBendahara = (official: Official) => {
    const updates: Record<string, any> = {
      nama_bendahara: official.name,
      nip_bendahara: official.nip,
      pangkat_bendahara: official.pangkat,
    };
    applyUpdates(updates);
  };

  const handleSelectAset = (official: Official) => {
    const updates: Record<string, any> = {
      nama_aset: official.name,
      nip_aset: official.nip,
    };
    if (official.skNumber && !values.sk_aset_nomor) {
      updates.sk_aset_nomor = official.skNumber;
    }
    applyUpdates(updates);
  };

  return (
    <div className="space-y-6">
      {/* 1. Pengguna Anggaran / PPK */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Pengguna Anggaran (PA) / PPK
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pejabat penanggung jawab pelaksanaan kegiatan dan penandatangan dokumen SPJ.
            </p>
          </div>

          {!isLocked("nama_pa") && (
            <button
              type="button"
              onClick={() => setPaPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Pilih PA/PPK dari Master</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nama Lengkap PA / PPK <span className="text-red-500">*</span>
              </label>
              {isLocked("nama_pa") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="nama_pa"
              value={values.nama_pa || ""}
              onChange={onChange}
              readOnly={isLocked("nama_pa")}
              placeholder="HADI JAYA, S.Sos., M.Si."
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isLocked("nama_pa")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                NIP PA / PPK
              </label>
              {isLocked("nip_pa") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="nip_pa"
              value={values.nip_pa || ""}
              onChange={onChange}
              readOnly={isLocked("nip_pa")}
              placeholder="19750101 200003 1 005"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked("nip_pa")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pangkat / Golongan PA
            </label>
            <input
              type="text"
              name="pangkat_pa"
              value={values.pangkat_pa || ""}
              onChange={onChange}
              placeholder="Pembina Tingkat I (IV/b)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Pejabat Pelaksana Teknis Kegiatan (PPTK) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Pejabat Pelaksana Teknis Kegiatan (PPTK)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas PPTK pengendali pelaksanaan kegiatan operasional.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPptkPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilih PPTK dari Master</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap PPTK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_pptk"
              value={values.nama_pptk || ""}
              onChange={onChange}
              placeholder="AHMAD FAUZI, S.STP."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP PPTK
            </label>
            <input
              type="text"
              name="nip_pptk"
              value={values.nip_pptk || ""}
              onChange={onChange}
              placeholder="19800101 200501 1 002"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pangkat PPTK
            </label>
            <input
              type="text"
              name="pangkat_pptk"
              value={values.pangkat_pptk || ""}
              onChange={onChange}
              placeholder="Penata Tingkat I (III/d)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 3. Bendahara & Pengurus Aset */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <h3 className="text-base font-semibold text-slate-900">
                Bendahara Pengeluaran &amp; Pengurus Aset
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Petugas pembukuan keuangan daerah dan verifikator serah terima barang aset.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setBendaharaPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Pilih Bendahara</span>
            </button>
            <button
              type="button"
              onClick={() => setAsetPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Pilih Pengurus Aset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Bendahara Pengeluaran <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_bendahara"
              value={values.nama_bendahara || ""}
              onChange={onChange}
              placeholder="SITI NURHALIZA, A.Md."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP Bendahara
            </label>
            <input
              type="text"
              name="nip_bendahara"
              value={values.nip_bendahara || ""}
              onChange={onChange}
              placeholder="19830514 200902 2 004"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pangkat Bendahara
            </label>
            <input
              type="text"
              name="pangkat_bendahara"
              value={values.pangkat_bendahara || ""}
              onChange={onChange}
              placeholder="Penata Muda (III/a)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Pengurus Aset / Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_aset"
              value={values.nama_aset || ""}
              onChange={onChange}
              placeholder="EKO PRASETYO, S.Kom."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP Pengurus Aset
            </label>
            <input
              type="text"
              name="nip_aset"
              value={values.nip_aset || ""}
              onChange={onChange}
              placeholder="19871102 201101 1 008"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 4. Nomor Surat & SK Pejabat */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="w-4 h-4 text-emerald-800" />
          <h3 className="text-base font-semibold text-slate-900">
            Nomor Surat Berita Acara &amp; Penetapan SK
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Nomor registrasi surat pertanggungjawaban dan keputusan pengangkatan pejabat.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Nomor SP */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nomor Surat Pesanan (SPK)
              </label>
              {isLocked("nomor_sp") && <Lock className="w-3 h-3 text-emerald-800" />}
            </div>
            <input
              type="text"
              name="nomor_sp"
              value={values.nomor_sp || ""}
              onChange={onChange}
              readOnly={isLocked("nomor_sp")}
              placeholder="027/       /SP/35.09.413/2026"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked("nomor_sp")
                  ? "bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                  : "bg-slate-50 border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              }`}
            />
          </div>

          {/* Nomor BAP ADM */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor BAP Administrasi
            </label>
            <input
              type="text"
              name="nomor_bap_adm"
              value={values.nomor_bap_adm || ""}
              onChange={onChange}
              placeholder="027/BAP-ADM/      /35.09.413/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Nomor BAHP */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor BAHP (Pemeriksaan)
            </label>
            <input
              type="text"
              name="nomor_bahp"
              value={values.nomor_bahp || ""}
              onChange={onChange}
              placeholder="027/BAHP/        /35.09.413/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Nomor BAST PPK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor BAST Rekanan ke PPK
            </label>
            <input
              type="text"
              name="nomor_bast_ppk"
              value={values.nomor_bast_ppk || ""}
              onChange={onChange}
              placeholder="027/BAST-PPK/      /35.09.413/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Nomor BAST Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor BAST Pengurus Aset
            </label>
            <input
              type="text"
              name="nomor_bast_aset"
              value={values.nomor_bast_aset || ""}
              onChange={onChange}
              placeholder="027/BAST-ASET/      /35.09.413/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Nomor BAPP */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor BA Pembayaran (BAPP)
            </label>
            <input
              type="text"
              name="nomor_bapp"
              value={values.nomor_bapp || ""}
              onChange={onChange}
              placeholder="027/      /BAPP/35.09.413/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* SK PA */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor SK PA / PPK
            </label>
            <input
              type="text"
              name="sk_pa_nomor"
              value={values.sk_pa_nomor || ""}
              onChange={onChange}
              placeholder="188.45/01/1.12/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* SK PPTK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor SK PPTK
            </label>
            <input
              type="text"
              name="sk_pptk_nomor"
              value={values.sk_pptk_nomor || ""}
              onChange={onChange}
              placeholder="188.45/02/1.12/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* SK Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor SK Pengurus Aset
            </label>
            <input
              type="text"
              name="sk_aset_nomor"
              value={values.sk_aset_nomor || ""}
              onChange={onChange}
              placeholder="188.45/03/1.12/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Official Pickers */}
      <OfficialPickerModal
        isOpen={paPickerOpen}
        onClose={() => setPaPickerOpen(false)}
        onSelect={handleSelectPa}
        targetRole="PA_PPK"
        title="Pilih Pengguna Anggaran (PA) / PPK"
        selectedName={values.nama_pa}
      />

      <OfficialPickerModal
        isOpen={pptkPickerOpen}
        onClose={() => setPptkPickerOpen(false)}
        onSelect={handleSelectPptk}
        targetRole="PPTK"
        title="Pilih Pejabat Pelaksana Teknis Kegiatan (PPTK)"
        selectedName={values.nama_pptk}
      />

      <OfficialPickerModal
        isOpen={bendaharaPickerOpen}
        onClose={() => setBendaharaPickerOpen(false)}
        onSelect={handleSelectBendahara}
        targetRole="BENDAHARA"
        title="Pilih Bendahara Pengeluaran"
        selectedName={values.nama_bendahara}
      />

      <OfficialPickerModal
        isOpen={asetPickerOpen}
        onClose={() => setAsetPickerOpen(false)}
        onSelect={handleSelectAset}
        targetRole="PENGURUS_ASET"
        title="Pilih Pengurus Barang / Aset"
        selectedName={values.nama_aset}
      />
    </div>
  );
}
