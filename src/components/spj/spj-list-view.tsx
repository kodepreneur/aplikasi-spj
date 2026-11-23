"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Building,
  Edit,
  FileDown,
  Trash2,
  UserCheck,
  AlertCircle,
  FileCheck2,
  FileSpreadsheet,
  Link2,
  AlertTriangle,
  Archive,
  Filter,
} from "lucide-react";
import type { SpjSummary } from "@/app/actions/spj";
import { deleteSpjAction } from "@/app/actions/spj";
import { NewSpjModal } from "./new-spj-modal";
import { ExcelModal } from "./excel-modal";

interface SpjListViewProps {
  initialSpjList: SpjSummary[];
  contracts: {
    id: string;
    packageName: string;
    providerName: string;
    spkNumber: string;
    budget: string;
    revision: number;
    createdAt: string;
  }[];
}

const numberFormat = new Intl.NumberFormat("id-ID");

export function SpjListView({ initialSpjList, contracts }: SpjListViewProps) {
  const [spjList, setSpjList] = useState<SpjSummary[]>(initialSpjList);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SpjSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Extract available years from records or defaults
  const availableYears = useMemo(() => {
    const set = new Set<string>(["2026", "2025"]);
    for (const item of spjList) {
      if (item.createdAt) {
        const y = new Date(item.createdAt).getFullYear().toString();
        set.add(y);
      }
    }
    return Array.from(set).sort().reverse();
  }, [spjList]);

  // Filtered list
  const filtered = useMemo(() => {
    let result = spjList;

    if (selectedYear !== "all") {
      result = result.filter((item) => {
        const y = new Date(item.createdAt).getFullYear().toString();
        return y === selectedYear;
      });
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.providerName.toLowerCase().includes(q) ||
          c.spkNumber.toLowerCase().includes(q) ||
          c.ownerName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [spjList, searchQuery, selectedYear]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    startTransition(async () => {
      try {
        const res = await deleteSpjAction(deleteTarget.id, deleteTarget.revision);
        if (res.success) {
          setSpjList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
          setDeleteTarget(null);
        } else {
          setDeleteError(res.message);
        }
      } catch (err: any) {
        setDeleteError(err?.message || "Gagal menghapus berkas SPJ.");
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
              Modul SPJ & Pemetaan Belanja
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
              {spjList.length} Dokumen
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pertanggungjawaban Belanja &amp; Berkas Word Offline Terpadu · Badan Pendapatan Daerah Kabupaten Jember
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Unduh Rekapitulasi Excel */}
          <button
            type="button"
            onClick={() => setExcelModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Rekap Excel</span>
          </button>

          {/* Buat SPJ Baru */}
          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat SPJ Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan uraian belanja, rekanan, SPK, atau pembuat..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SPJ Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {searchQuery ? "Tidak ada SPJ yang sesuai pencarian" : "Belum ada berkas SPJ"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Coba gunakan kata kunci pencarian yang lain."
                : "Mulai buat dokumen pertanggungjawaban belanja baik mandiri atau meneruskan kontrak."}
            </p>
            {!searchQuery && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Buat SPJ Sekarang
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[240px]">Paket Belanja / Pekerjaan</th>
                  <th className="py-3 px-4 min-w-[180px]">Penyedia &amp; No. SPK</th>
                  <th className="py-3 px-4 w-32 text-right">Nilai Bruto</th>
                  <th className="py-3 px-4 w-32 text-right">Nilai Netto</th>
                  <th className="py-3 px-4 w-36 text-center">Status Sumber</th>
                  <th className="py-3 px-4 w-28 text-center">Pembuat</th>
                  <th className="py-3 px-4 w-16 text-center">Revisi</th>
                  <th className="py-3 px-4 w-28 text-center">Pembaruan</th>
                  <th className="py-3 px-4 w-36 text-center">Aksi</th>
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
                          href={`/spj/${item.id}/edit`}
                          className="font-semibold text-slate-900 hover:text-emerald-800 transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono line-clamp-1">
                          ID: {item.id.slice(0, 8)}...
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium line-clamp-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.providerName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono line-clamp-1">
                          SPK: {item.spkNumber}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        Rp {numberFormat.format(item.total)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        Rp {numberFormat.format(item.net)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.sourceStatus === "changed" ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                            title="Kontrak sumber telah diperbarui. Perbarui di formulir SPJ."
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Sumber Berubah
                          </span>
                        ) : item.sourceStatus === "deleted" ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"
                            title="Kontrak sumber telah dihapus. Menggunakan snapshot beku."
                          >
                            <Archive className="w-3 h-3 text-slate-500" />
                            Beku (Sumber Dihapus)
                          </span>
                        ) : item.isLinked ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                            title="Tersinkronisasi dari Kontrak Pengadaan"
                          >
                            <Link2 className="w-3 h-3 text-emerald-600" />
                            Tertaut
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                            Mandiri
                          </span>
                        )}
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
                            href={`/spj/${item.id}/edit`}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-all"
                            title="Edit Formulir SPJ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* Unduh Word */}
                          {item.sourceStatus === "changed" ? (
                            <button
                              type="button"
                              onClick={() =>
                                alert(
                                  "Kontrak sumber telah diperbarui. Silakan buka formulir SPJ dan tekan 'Perbarui dari kontrak' sebelum mengunduh Word."
                                )
                              }
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-all cursor-pointer"
                              title="Sumber Berubah: Kunci Unduhan Word Aktif"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <a
                              href={`/api/export/word/spj/${item.id}`}
                              download
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-all"
                              title="Unduh Berkas SPJ Word (.docx)"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Hapus */}
                          {item.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                              title="Hapus Dokumen SPJ"
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
            <div className="flex items-center gap-3 text-red-700 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Hapus Dokumen SPJ?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan mengarsipkan berkas SPJ secara permanen.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold">{deleteTarget.title}</span>
              <br />
              <span className="text-slate-500 font-mono text-[11px]">
                SPK: {deleteTarget.spkNumber} · Revisi #{deleteTarget.revision}
              </span>
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-red-700/60 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPending ? "Menghapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New SPJ Modal */}
      <NewSpjModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        contracts={contracts}
      />

      {/* Excel Export Modal */}
      <ExcelModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        availableYears={availableYears}
      />
    </div>
  );
}
