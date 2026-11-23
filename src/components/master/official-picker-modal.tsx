"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, X, Plus, AlertCircle, Check } from "lucide-react";
import { getOfficialsAction, saveOfficialAction } from "@/app/actions/officials";
import type { Official } from "@/lib/db/schema";

interface OfficialPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (official: Official) => void;
  targetRole?: "PA_PPK" | "PPTK" | "PEJABAT_PENGADAAN" | "BENDAHARA" | "PENGURUS_ASET" | "ALL";
  title?: string;
  selectedName?: string;
}

export function OfficialPickerModal({
  isOpen,
  onClose,
  onSelect,
  targetRole = "ALL",
  title = "Pilih dari Master Data Pejabat",
  selectedName = "",
}: OfficialPickerModalProps) {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick Add Mode
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [pangkat, setPangkat] = useState("");
  const [role, setRole] = useState(targetRole === "ALL" ? "PA_PPK" : targetRole);
  const [skNumber, setSkNumber] = useState("");
  const [skDate, setSkDate] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadOfficials = async () => {
    setLoading(true);
    try {
      const data = await getOfficialsAction(targetRole);
      setOfficials(data);
    } catch (err) {
      console.error("Failed to load officials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOfficials();
      setIsAdding(false);
      setErrorMessage("");
      if (targetRole !== "ALL") {
        setRole(targetRole);
      }
    }
  }, [isOpen, targetRole]);

  if (!isOpen) return null;

  const filtered = officials.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      (o.nip && o.nip.toLowerCase().includes(q)) ||
      (o.pangkat && o.pangkat.toLowerCase().includes(q)) ||
      (o.skNumber && o.skNumber.toLowerCase().includes(q))
    );
  });

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "PA_PPK":
        return "Pengguna Anggaran / PPK";
      case "PPTK":
        return "PPTK";
      case "PEJABAT_PENGADAAN":
        return "Pejabat Pengadaan";
      case "BENDAHARA":
        return "Bendahara Pengeluaran";
      case "PENGURUS_ASET":
        return "Pengurus Barang / Aset";
      default:
        return r;
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Nama lengkap pejabat wajib diisi.");
      return;
    }

    setSaveLoading(true);
    setErrorMessage("");
    try {
      const res = await saveOfficialAction({
        name,
        nip,
        pangkat,
        role: role as any,
        skNumber,
        skDate,
      });

      if (res.success && res.official) {
        onSelect(res.official);
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan pejabat.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isAdding ? "Tambah Pejabat ke Master Data" : title}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdding
                  ? "Pejabat yang disimpan dapat dipilih di dokumen Kontrak & SPJ"
                  : `Menampilkan daftar pejabat ${targetRole !== "ALL" ? getRoleLabel(targetRole) : "Bapenda"}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAdding ? (
          <>
            {/* Search and Action Bar */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, NIP, pangkat, atau nomor SK..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setName(search);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#003463] hover:bg-[#002447] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Baru</span>
              </button>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 min-h-[260px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <span>Memuat master data pejabat...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                  <UserCheck className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Pejabat tidak ditemukan</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {search
                      ? `Tidak ada pejabat yang cocok dengan kata kunci "${search}".`
                      : "Belum ada master data pejabat pada kategori ini."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(true);
                      setName(search);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003463] text-white rounded-lg text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pejabat Baru
                  </button>
                </div>
              ) : (
                filtered.map((item) => {
                  const isMatchSelected =
                    selectedName && item.name.toLowerCase() === selectedName.toLowerCase();

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group flex items-start justify-between gap-4 ${
                        isMatchSelected ? "bg-blue-50/70 border border-blue-200" : ""
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-800 transition-colors">
                            {item.name}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {getRoleLabel(item.role)}
                          </span>
                          {isMatchSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-800">
                              <Check className="w-3 h-3" /> Sedang Dipilih
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 space-y-0.5 pt-0.5">
                          {item.nip && (
                            <div>
                              <span className="text-slate-400">NIP:</span>{" "}
                              <span className="font-mono">{item.nip}</span>
                            </div>
                          )}
                          {item.pangkat && (
                            <div>
                              <span className="text-slate-400">Pangkat/Golongan:</span> {item.pangkat}
                            </div>
                          )}
                          {item.skNumber && (
                            <div className="text-[11px] text-slate-500">
                              <span className="text-slate-400">SK:</span> {item.skNumber}{" "}
                              {item.skDate ? `(Tgl: ${item.skDate})` : ""}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 group-hover:bg-[#003463] group-hover:text-white transition-all shrink-0 cursor-pointer"
                      >
                        Pilih
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan {filtered.length} pejabat</span>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </>
        ) : (
          /* Form Tambah Cepat */
          <form onSubmit={handleQuickAdd} className="p-6 overflow-y-auto space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peran Pejabat <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PA_PPK">Pengguna Anggaran (PA) / PPK</option>
                <option value="PPTK">Pejabat Pelaksana Teknis Kegiatan (PPTK)</option>
                <option value="PEJABAT_PENGADAAN">Pejabat Pengadaan Barang/Jasa</option>
                <option value="BENDAHARA">Bendahara Pengeluaran</option>
                <option value="PENGURUS_ASET">Pengurus Barang Pengguna / Aset</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: HADI JAYA, S.Sos., M.Si."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP Pejabat
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="19750101 200003 1 005"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pangkat / Golongan Ruang
                </label>
                <input
                  type="text"
                  value={pangkat}
                  onChange={(e) => setPangkat(e.target.value)}
                  placeholder="Pembina Tingkat I (IV/b)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor SK Pengangkatan (Opsional)
                </label>
                <input
                  type="text"
                  value={skNumber}
                  onChange={(e) => setSkNumber(e.target.value)}
                  placeholder="188.45/01/1.12/2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal SK Pengangkatan (Opsional)
                </label>
                <input
                  type="date"
                  value={skDate}
                  onChange={(e) => setSkDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-4 py-2 bg-[#003463] hover:bg-[#002447] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {saveLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Simpan &amp; Pilih Pejabat</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
