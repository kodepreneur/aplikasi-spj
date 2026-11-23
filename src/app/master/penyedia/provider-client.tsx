"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  CheckCheck,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  saveProviderAction,
  deleteProviderAction,
  seedSampleProvidersAction,
  type ProviderInput,
} from "@/app/actions/providers";
import type { Provider } from "@/lib/db/schema";

interface ProviderClientProps {
  initialProviders: Provider[];
}

export function ProviderClient({ initialProviders }: ProviderClientProps) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProviderInput>({
    name: "",
    type: "CV",
    director: "",
    address: "",
    npwp: "",
    phone: "",
    position: "DIREKTUR",
    paymentPosition: "DIREKTUR",
    bankName: "Bank Jatim",
    bankAccount: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const filtered = providers.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.director && p.director.toLowerCase().includes(search.toLowerCase())) ||
      (p.npwp && p.npwp.toLowerCase().includes(search.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase())) ||
      (p.bankAccount && p.bankAccount.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === "ALL" || p.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openAddModal = () => {
    setEditingProvider(null);
    setFormData({
      name: "",
      type: "CV",
      director: "",
      address: "",
      npwp: "",
      phone: "",
      position: "DIREKTUR",
      paymentPosition: "DIREKTUR",
      bankName: "Bank Jatim",
      bankAccount: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (p: Provider) => {
    setEditingProvider(p);
    setFormData({
      id: p.id,
      name: p.name,
      type: p.type as any,
      director: p.director || "",
      address: p.address || "",
      npwp: p.npwp || "",
      phone: p.phone || "",
      position: p.position || "DIREKTUR",
      paymentPosition: p.paymentPosition || "DIREKTUR",
      bankName: p.bankName || "Bank Jatim",
      bankAccount: p.bankAccount || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showStatus("error", "Nama perusahaan wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await saveProviderAction(formData);
      if (res.success && res.provider) {
        if (editingProvider) {
          setProviders((prev) =>
            prev.map((item) => (item.id === res.provider!.id ? res.provider! : item))
          );
        } else {
          setProviders((prev) => [res.provider!, ...prev]);
        }
        setModalOpen(false);
        showStatus("success", res.message);
      } else {
        showStatus("error", res.message);
      }
    } catch (err: any) {
      showStatus("error", err.message || "Gagal menyimpan penyedia.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await deleteProviderAction(id);
      if (res.success) {
        setProviders((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
        showStatus("success", res.message);
      } else {
        showStatus("error", res.message);
      }
    } catch (err: any) {
      showStatus("error", err.message || "Gagal menghapus penyedia.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedSampleProvidersAction();
      if (res.success) {
        window.location.reload();
      } else {
        showStatus("error", res.message);
      }
    } catch (err: any) {
      showStatus("error", err.message || "Gagal memuat data contoh.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-sm transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Master Data Administrasi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Master Data Penyedia &amp; Rekanan
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Katalog data vendor, profil perusahaan, nomor rekening bank, dan NPWP rekanan pengadaan Bapenda Jember.
            Data ini langsung terhubung dan otomatis mengisi formulir Kontrak Manual dan SPJ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {providers.length === 0 && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Muat Data Contoh</span>
            </button>
          )}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penyedia Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama perusahaan, NPWP, direktur, rekening..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        {/* Bentuk Usaha Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "CV", "PT", "UD", "Koperasi", "Perorangan"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                filterType === t
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t === "ALL" ? "Semua Badan Usaha" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Tidak ada penyedia ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || filterType !== "ALL"
                ? "Tidak ada data yang cocok dengan kriteria pencarian atau filter yang dipilih."
                : "Belum ada master data penyedia. Klik Tambah Penyedia Baru untuk menambahkan."}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Penyedia
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Rekanan &amp; Badan Usaha</th>
                  <th className="py-3 px-4">Pimpinan &amp; Jabatan</th>
                  <th className="py-3 px-4">NPWP</th>
                  <th className="py-3 px-4">Bank &amp; Rekening</th>
                  <th className="py-3 px-4">Alamat &amp; Kontak</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama & Bentuk */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.type}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Ditambahkan: {item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "-"}
                      </div>
                    </td>

                    {/* Pimpinan & Jabatan */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {item.director || "-"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.position || "DIREKTUR"}
                      </div>
                    </td>

                    {/* NPWP */}
                    <td className="py-3.5 px-4">
                      {item.npwp ? (
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <span>{item.npwp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.npwp, `npwp-${item.id}`)}
                            title="Salin NPWP"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            {copiedId === `npwp-${item.id}` ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Bank & Rekening */}
                    <td className="py-3.5 px-4">
                      {item.bankAccount ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-slate-900 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.bankAccount}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.bankAccount, `bank-${item.id}`)}
                              title="Salin No Rekening"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              {copiedId === `bank-${item.id}` ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 ml-5">
                            {item.bankName || "Bank Jatim"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Alamat & Kontak */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {item.address ? (
                        <div className="flex items-start gap-1 text-slate-600 line-clamp-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{item.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {item.phone && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Edit Rekanan"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          title="Hapus Rekanan"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500 flex items-center justify-between">
          <span>Total {filtered.length} rekanan dari {providers.length} terdaftar</span>
          <span className="text-[11px] text-slate-400">Data tersimpan di database lokal SQLite Bapenda</span>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {editingProvider ? "Edit Data Rekanan" : "Tambah Rekanan Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingProvider
                      ? "Perbarui informasi profil dan rekening rekanan"
                      : "Daftarkan rekanan baru ke Master Data pengadaan Bapenda"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bentuk Usaha <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.director || ""}
                    onChange={(e) => setFormData({ ...formData, director: e.target.value })}
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
                    value={formData.npwp || ""}
                    onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
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
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan BA &amp; Kuitansi
                  </label>
                  <input
                    type="text"
                    value={formData.position || "DIREKTUR"}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="DIREKTUR / PEMILIK"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan Permohonan Bayar
                  </label>
                  <input
                    type="text"
                    value={formData.paymentPosition || "DIREKTUR"}
                    onChange={(e) => setFormData({ ...formData, paymentPosition: e.target.value })}
                    placeholder="DIREKTUR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap Kantor
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    value={formData.bankName || "Bank Jatim"}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
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
                    value={formData.bankAccount || ""}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="0031019575"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingProvider ? "Perbarui Penyedia" : "Simpan Penyedia"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Hapus Rekanan?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data rekanan ini akan dihapus dari daftar master. Dokumen kontrak atau SPJ yang sudah menggunakan data ini tidak akan terpengaruh.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={loading}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
