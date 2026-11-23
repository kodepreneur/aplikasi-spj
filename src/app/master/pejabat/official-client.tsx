"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  X,
  FileCheck,
  Shield,
  Briefcase,
} from "lucide-react";
import {
  saveOfficialAction,
  deleteOfficialAction,
  seedSampleOfficialsAction,
  type OfficialInput,
} from "@/app/actions/officials";
import type { Official } from "@/lib/db/schema";

interface OfficialClientProps {
  initialOfficials: Official[];
}

export function OfficialClient({ initialOfficials }: OfficialClientProps) {
  const [officials, setOfficials] = useState<Official[]>(initialOfficials);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<OfficialInput>({
    name: "",
    nip: "",
    pangkat: "",
    role: "PA_PPK",
    positionTitle: "",
    skNumber: "",
    skDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

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

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case "PA_PPK":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "PPTK":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "PEJABAT_PENGADAAN":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "BENDAHARA":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "PENGURUS_ASET":
        return "bg-cyan-50 text-cyan-800 border-cyan-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filtered = officials.filter((o) => {
    const matchesSearch =
      search === "" ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.nip && o.nip.toLowerCase().includes(search.toLowerCase())) ||
      (o.pangkat && o.pangkat.toLowerCase().includes(search.toLowerCase())) ||
      (o.skNumber && o.skNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = filterRole === "ALL" || o.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openAddModal = () => {
    setEditingOfficial(null);
    setFormData({
      name: "",
      nip: "",
      pangkat: "",
      role: filterRole !== "ALL" ? (filterRole as any) : "PA_PPK",
      positionTitle: "",
      skNumber: "",
      skDate: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (o: Official) => {
    setEditingOfficial(o);
    setFormData({
      id: o.id,
      name: o.name,
      nip: o.nip || "",
      pangkat: o.pangkat || "",
      role: o.role as any,
      positionTitle: o.positionTitle || "",
      skNumber: o.skNumber || "",
      skDate: o.skDate || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showStatus("error", "Nama pejabat wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await saveOfficialAction(formData);
      if (res.success && res.official) {
        if (editingOfficial) {
          setOfficials((prev) =>
            prev.map((item) => (item.id === res.official!.id ? res.official! : item))
          );
        } else {
          setOfficials((prev) => [res.official!, ...prev]);
        }
        setModalOpen(false);
        showStatus("success", res.message);
      } else {
        showStatus("error", res.message);
      }
    } catch (err: any) {
      showStatus("error", err.message || "Gagal menyimpan data pejabat.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await deleteOfficialAction(id);
      if (res.success) {
        setOfficials((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
        showStatus("success", res.message);
      } else {
        showStatus("error", res.message);
      }
    } catch (err: any) {
      showStatus("error", err.message || "Gagal menghapus data pejabat.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedSampleOfficialsAction();
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
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Master Data Administrasi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Master Data Pejabat Penandatangan
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Daftar ASN dan pejabat penandatangan pengadaan Bapenda: Pengguna Anggaran (PA/PPK), PPTK, Pejabat Pengadaan, Bendahara Pengeluaran, dan Pengurus Aset.
            Mencegah pengetikan manual berulang untuk NIP, Pangkat, dan SK Pengangkatan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {officials.length === 0 && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Muat Pejabat Default</span>
            </button>
          )}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#003463] hover:bg-[#002447] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pejabat Baru</span>
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
            placeholder="Cari nama pejabat, NIP, pangkat, SK..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "ALL", label: "Semua Pejabat" },
            { key: "PA_PPK", label: "PA / PPK" },
            { key: "PPTK", label: "PPTK" },
            { key: "PEJABAT_PENGADAAN", label: "Pengadaan" },
            { key: "BENDAHARA", label: "Bendahara" },
            { key: "PENGURUS_ASET", label: "Pengurus Aset" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterRole(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                filterRole === item.key
                  ? "bg-[#003463] text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Tidak ada data pejabat</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Belum ada pejabat yang sesuai dengan filter. Klik tombol di bawah untuk menambahkan pejabat baru.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#003463] text-white rounded-lg text-xs font-semibold hover:bg-[#002447] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Pejabat
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap &amp; Peran</th>
                  <th className="py-3 px-4">NIP Pejabat</th>
                  <th className="py-3 px-4">Pangkat / Golongan</th>
                  <th className="py-3 px-4">Dasar SK Pengangkatan</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama & Peran */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadgeStyle(item.role)}`}>
                          {getRoleLabel(item.role)}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        {item.name}
                      </span>
                    </td>

                    {/* NIP */}
                    <td className="py-3.5 px-4">
                      {item.nip ? (
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 font-medium">
                          <span>{item.nip}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.nip, `nip-${item.id}`)}
                            title="Salin NIP"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            {copiedId === `nip-${item.id}` ? (
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

                    {/* Pangkat */}
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.pangkat || "-"}
                    </td>

                    {/* SK */}
                    <td className="py-3.5 px-4">
                      {item.skNumber ? (
                        <div>
                          <div className="font-mono text-slate-800 font-medium">{item.skNumber}</div>
                          {item.skDate && (
                            <div className="text-[11px] text-slate-500">
                              Tanggal: {item.skDate}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Edit Pejabat"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          title="Hapus Pejabat"
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
          <span>Menampilkan {filtered.length} pejabat dari {officials.length} terdaftar</span>
          <span className="text-[11px] text-slate-400">Terintegrasi langsung ke formulir Kontrak &amp; SPJ</span>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {editingOfficial ? "Edit Data Pejabat" : "Tambah Pejabat Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingOfficial
                      ? "Perbarui informasi ASN penandatangan"
                      : "Daftarkan pejabat baru ke Master Data pengadaan Bapenda"}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran / Jabatan Penandatangan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
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
                  Nama Lengkap beserta Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: HADI JAYA, S.Sos., M.Si."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    value={formData.nip || ""}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
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
                    value={formData.pangkat || ""}
                    onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                    placeholder="Pembina Tingkat I (IV/b)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor SK Pengangkatan
                  </label>
                  <input
                    type="text"
                    value={formData.skNumber || ""}
                    onChange={(e) => setFormData({ ...formData, skNumber: e.target.value })}
                    placeholder="188.45/01/1.12/2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal SK Pengangkatan
                  </label>
                  <input
                    type="date"
                    value={formData.skDate || ""}
                    onChange={(e) => setFormData({ ...formData, skDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="px-4 py-2 bg-[#003463] hover:bg-[#002447] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingOfficial ? "Perbarui Pejabat" : "Simpan Pejabat"}</span>
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
              <h3 className="text-base font-bold text-slate-900">Hapus Data Pejabat?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data pejabat ini akan dinonaktifkan dari daftar master. Dokumen yang sudah menggunakan data ini tetap aman.
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
