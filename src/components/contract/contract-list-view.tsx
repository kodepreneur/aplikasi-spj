"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  Building,
  Edit,
  Printer,
  FileDown,
  Trash2,
  Clock,
  UserCheck,
  AlertCircle,
  X,
  FileCheck2,
} from "lucide-react";
import type { ContractSummary } from "@/app/actions/contract";
import { deleteContractAction } from "@/app/actions/contract";

interface ContractListViewProps {
  initialContracts: ContractSummary[];
}

export function ContractListView({ initialContracts }: ContractListViewProps) {
  const [contracts, setContracts] = useState<ContractSummary[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ContractSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtered list
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contracts;
    return contracts.filter(
      (c) =>
        c.packageName.toLowerCase().includes(q) ||
        c.providerName.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q)
    );
  }, [contracts, searchQuery]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      try {
        const res = await deleteContractAction(deleteTarget.id, deleteTarget.revision);
        if (res.success) {
          setContracts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
          setDeleteTarget(null);
        } else {
          setDeleteError(res.message);
        }
      } catch (err: any) {
        setDeleteError(err?.message || "Gagal menghapus kontrak.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Modul Kontrak Manual Terpadu
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
              {contracts.length} Dokumen
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengadaan Langsung Barang/Jasa Pemerintah &lt; Rp 200 Juta · Badan Pendapatan Daerah Kabupaten Jember
          </p>
        </div>

        <Link
          href="/kontrak/baru"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kontrak Baru</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan paket, rekanan, atau pembuat..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {searchQuery ? "Tidak ada kontrak yang sesuai pencarian" : "Belum ada berkas kontrak"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Coba gunakan kata kunci pencarian yang lain."
                : "Mulai buat dokumen pengadaan langsung baru dengan 18 berkas Word otomatis."}
            </p>
            {!searchQuery && (
              <div className="mt-4">
                <Link
                  href="/kontrak/baru"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Buat Kontrak Sekarang
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[240px]">Paket Pengadaan</th>
                  <th className="py-3 px-4 min-w-[180px]">Penyedia / Rekanan</th>
                  <th className="py-3 px-4 w-32 text-right">Pagu Anggaran</th>
                  <th className="py-3 px-4 w-32 text-right">Nilai Kontrak</th>
                  <th className="py-3 px-4 w-28 text-center">Pembuat</th>
                  <th className="py-3 px-4 w-20 text-center">Revisi</th>
                  <th className="py-3 px-4 w-32 text-center">Pembaruan</th>
                  <th className="py-3 px-4 w-44 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => {
                  const updatedDate = new Date(item.updatedAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/kontrak/${item.id}/edit`}
                          className="font-semibold text-slate-900 hover:text-emerald-800 transition-colors line-clamp-1"
                        >
                          {item.packageName}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          ID: {item.id.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium line-clamp-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.providerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        Rp {item.budget}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        Rp {item.finalTotal}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          {item.ownerName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          #{item.revision}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-[11px] text-slate-500 font-mono">
                        {updatedDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit */}
                          <Link
                            href={`/kontrak/${item.id}/edit`}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-all"
                            title="Edit Formulir Kontrak"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* Cetak A4 */}
                          <Link
                            href={`/kontrak/${item.id}/cetak`}
                            target="_blank"
                            className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all"
                            title="Pratinjau Cetak A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>

                          {/* Unduh Word */}
                          <a
                            href={`/api/export/word/kontrak/${item.id}`}
                            download
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-all"
                            title="Unduh 18 Dokumen Word (.docx)"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>

                          {/* Hapus */}
                          {item.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                              title="Hapus Dokumen Kontrak"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Dokumen Kontrak?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus paket pengadaan{" "}
                  <span className="font-semibold text-slate-900">
                    &ldquo;{deleteTarget.packageName}&rdquo;
                  </span>
                  ? Dokumen ini akan dipindahkan ke arsip terhapus.
                </p>

                {deleteError && (
                  <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {deleteError}
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(null);
                      setDeleteError(null);
                    }}
                    disabled={isPending}
                    className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {isPending ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
