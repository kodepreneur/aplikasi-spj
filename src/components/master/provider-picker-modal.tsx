"use client";

import { useState, useEffect } from "react";
import { Search, Building2, Check, X, Plus, AlertCircle, Copy, CheckCheck } from "lucide-react";
import { getProvidersAction, saveProviderAction } from "@/app/actions/providers";
import type { Provider } from "@/lib/db/schema";

interface ProviderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: Provider) => void;
  selectedName?: string;
}

export function ProviderPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedName = "",
}: ProviderPickerModalProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick Add Mode
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<"CV" | "PT" | "UD" | "Koperasi" | "Perorangan">("CV");
  const [newName, setNewName] = useState("");
  const [newDirector, setNewDirector] = useState("");
  const [newNpwp, setNewNpwp] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBank, setNewBank] = useState("Bank Jatim");
  const [newAccount, setNewAccount] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await getProvidersAction();
      setProviders(data);
    } catch (err) {
      console.error("Failed to load providers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProviders();
      setIsAdding(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = providers.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.director && p.director.toLowerCase().includes(q)) ||
      (p.npwp && p.npwp.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.bankAccount && p.bankAccount.toLowerCase().includes(q))
    );
  });

  const handleCopy = (text: string, fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMessage("Nama perusahaan wajib diisi.");
      return;
    }

    setSaveLoading(true);
    setErrorMessage("");
    try {
      const res = await saveProviderAction({
        name: newName,
        type: newType,
        director: newDirector,
        npwp: newNpwp,
        address: newAddress,
        phone: newPhone,
        bankName: newBank,
        bankAccount: newAccount,
      });

      if (res.success && res.provider) {
        onSelect(res.provider);
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan penyedia.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isAdding ? "Tambah Rekanan ke Master Data" : "Pilih dari Master Data Penyedia"}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdding
                  ? "Rekanan yang disimpan dapat digunakan kembali di Kontrak & SPJ"
                  : "Pilih rekanan untuk mengisi otomatis seluruh data vendor"}
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
                  placeholder="Cari nama perusahaan, penandatangan, NPWP, atau no rekening..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setNewName(search);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Baru</span>
              </button>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <span>Memuat master data penyedia...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                  <Building2 className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Penyedia tidak ditemukan</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {search
                      ? `Tidak ada rekanan yang cocok dengan kata kunci "${search}". Anda dapat menambahkannya sekarang.`
                      : "Belum ada master data penyedia yang tersimpan."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(true);
                      setNewName(search);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-medium hover:bg-emerald-900"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Rekanan Ini
                  </button>
                </div>
              ) : (
                filtered.map((item) => {
                  const isMatchSelected =
                    selectedName &&
                    item.name.toLowerCase() === selectedName.toLowerCase().replace(/^(?:cv|pt|ud)\.?\s+/i, "");

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group flex items-start justify-between gap-4 ${
                        isMatchSelected ? "bg-emerald-50/70 border border-emerald-200" : ""
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {item.type}
                          </span>
                          <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {item.name}
                          </span>
                          {isMatchSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> Sedang Dipilih
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                          {item.director && (
                            <div>
                              <span className="text-slate-400">Pimpinan:</span> {item.director}
                            </div>
                          )}
                          {item.npwp && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">NPWP:</span>
                              <span className="font-mono">{item.npwp}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.npwp, `npwp-${item.id}`, e)}
                                title="Salin NPWP"
                                className="text-slate-400 hover:text-slate-600 ml-1"
                              >
                                {copiedField === `npwp-${item.id}` ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {item.bankAccount && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Rekening:</span>
                              <span className="font-mono">{item.bankAccount}</span> ({item.bankName})
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.bankAccount, `bank-${item.id}`, e)}
                                title="Salin No Rekening"
                                className="text-slate-400 hover:text-slate-600 ml-1"
                              >
                                {copiedField === `bank-${item.id}` ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {item.phone && (
                            <div>
                              <span className="text-slate-400">Kontak:</span> {item.phone}
                            </div>
                          )}
                        </div>

                        {item.address && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 pt-0.5">
                            {item.address}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 group-hover:bg-emerald-800 group-hover:text-white transition-all shrink-0 cursor-pointer"
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
              <span>Menampilkan {filtered.length} rekanan terdaftar</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bentuk Usaha <span className="text-red-500">*</span>
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="CV">CV</option>
                  <option value="PT">PT</option>
                  <option value="UD">UD</option>
                  <option value="Koperasi">Koperasi</option>
                  <option value="Perorangan">Perorangan</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan (Tanpa Awalan CV/PT) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="LUNA SENTOSA GEMILANG INDONESIA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pimpinan / Direktur
                </label>
                <input
                  type="text"
                  value={newDirector}
                  onChange={(e) => setNewDirector(e.target.value)}
                  placeholder="LUSI ANGGRAENI SEMBIRING"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NPWP Rekanan
                </label>
                <input
                  type="text"
                  value={newNpwp}
                  onChange={(e) => setNewNpwp(e.target.value)}
                  placeholder="71.746.501.7-626.000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / Kontak
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Kantor Lengkap
                </label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="JALAN SUMATRA NOMOR 82B, JEMBER"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Tujuan Pencairan
                </label>
                <input
                  type="text"
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  placeholder="Bank Jatim"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Rekening Bank
                </label>
                <input
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  placeholder="0031019575"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {saveLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Simpan &amp; Pilih Rekanan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
