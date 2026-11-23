"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus, FileText, ArrowRight, X, Building, Check, Layers } from "lucide-react";

interface ContractOption {
  id: string;
  packageName: string;
  providerName: string;
  spkNumber: string;
  budget: string;
  revision: number;
}

interface NewSpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: ContractOption[];
}

export function NewSpjModal({ isOpen, onClose, contracts }: NewSpjModalProps) {
  const router = useRouter();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"choice" | "select-contract">("choice");

  if (!isOpen) return null;

  const handleStartBlank = () => {
    onClose();
    router.push("/spj/baru");
  };

  const handleStartLinked = () => {
    if (!selectedContractId) return;
    onClose();
    router.push(`/spj/baru?fromContract=${selectedContractId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {viewMode === "choice" ? "Mulai Pembuatan SPJ" : "Pilih Kontrak Pengadaan Sumber"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === "choice"
                ? "Pilih metode pembuatan dokumen pertanggungjawaban belanja"
                : "Pilih kontrak manual yang ingin diteruskan ke SPJ"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {viewMode === "choice" ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opsi 1: SPJ Mandiri */}
            <button
              type="button"
              onClick={handleStartBlank}
              className="p-5 text-left border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/40 rounded-xl transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                  <FilePlus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  SPJ Baru Mandiri
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Isi kuitansi, tanggal, pejabat, dan rincian belanja secara manual dari awal tanpa kontrak.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <span>Mulai Blanko Baru</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Opsi 2: Dari Kontrak */}
            <button
              type="button"
              onClick={() => setViewMode("select-contract")}
              className="p-5 text-left border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/40 rounded-xl transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Meneruskan Kontrak Manual
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Otomatis memetakan nomor SPK, rekanan, NPWP, dan seluruh rincian RAB hasil negosiasi.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <span>Pilih Kontrak ({contracts.length})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {contracts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Belum ada berkas kontrak pengadaan yang tersimpan. Buat kontrak manual terlebih dahulu.
                </p>
              ) : (
                contracts.map((c) => {
                  const isSelected = selectedContractId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedContractId(c.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-700 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 truncate">
                            {c.packageName}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            Rev #{c.revision}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1 truncate">
                            <Building className="w-3 h-3" />
                            {c.providerName}
                          </span>
                          <span>·</span>
                          <span className="font-mono">SPK: {c.spkNumber}</span>
                          <span>·</span>
                          <span className="font-mono text-emerald-800 font-semibold">
                            Rp {c.budget}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-emerald-800 border-emerald-800 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode("choice")}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                ← Kembali
              </button>

              <button
                type="button"
                onClick={handleStartLinked}
                disabled={!selectedContractId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <span>Teruskan ke SPJ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
