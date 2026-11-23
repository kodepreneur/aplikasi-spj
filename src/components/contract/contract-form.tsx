"use client";

import { useState, useMemo, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Download,
  Upload,
  Printer,
  FileDown,
  History,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building,
  Users,
  Calendar,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { saveContractAction } from "@/app/actions/contract";
import {
  calculateContract,
  summarizeCalculation,
  type FormattedContractSummary,
} from "@/lib/domain/contract-calc";
import type { Event } from "@/lib/db/schema";
import { ContractSummaryBar } from "./contract-summary-bar";
import { IdentitySection } from "./sections/identity-section";
import { ProviderSection } from "./sections/provider-section";
import { OfficialsSection } from "./sections/officials-section";
import { LettersSection } from "./sections/letters-section";
import { RabSection } from "./sections/rab-section";
import { ConflictDialog } from "./conflict-dialog";
import { HistoryDialog } from "./history-dialog";

export interface ContractFormProps {
  mode: "create" | "edit";
  initialData: Record<string, any>;
  contractId?: string;
  initialRevision?: number;
  canEdit?: boolean;
  events?: Event[];
}

type TabKey = "identitas" | "penyedia" | "pejabat" | "surat" | "rab";

export function ContractForm({
  mode,
  initialData,
  contractId,
  initialRevision = 1,
  canEdit = true,
  events = [],
}: ContractFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<Record<string, any>>(() => ({
    ...initialData,
  }));

  const [activeTab, setActiveTab] = useState<TabKey>("identitas");
  const [revision, setRevision] = useState<number>(initialRevision);
  const [currentContractId, setCurrentContractId] = useState<string | undefined>(contractId);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Dialogs
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictRevision, setConflictRevision] = useState<number | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Live calculation
  const calculations: FormattedContractSummary = useMemo(() => {
    try {
      const result = calculateContract(formData as any);
      return summarizeCalculation(result);
    } catch {
      return {
        earlySubtotal: "0",
        earlyVat: "0",
        earlyTotal: "0",
        earlyWords: "Nol rupiah",
        finalSubtotal: "0",
        finalVat: "0",
        finalTotal: "0",
        finalWords: "Nol rupiah",
        budget: formData.budget || "0",
        budgetWords: "Nol rupiah",
        earlyDiff: "0",
        finalDiff: "0",
        itemCount: 0,
        errors: ["Format angka atau isian belum lengkap."],
      };
    }
  }, [formData]);

  // Handle generic input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBatchChange = (updates: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(updates)) {
        delete next[k];
      }
      return next;
    });
  };

  // Handle RAB Groups changes
  const handleGroupsChange = (newGroups: any[]) => {
    setFormData((prev) => ({ ...prev, groups: newGroups }));
  };

  // Save Contract
  const handleSave = () => {
    setStatusMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const result = await saveContractAction({
          id: currentContractId || null,
          payload: formData,
          expectedRevision: currentContractId ? revision : undefined,
        });

        if (result.success) {
          setStatusMessage({ type: "success", text: result.message });
          if (result.revision) {
            setRevision(result.revision);
          }
          if (result.id && !currentContractId) {
            setCurrentContractId(result.id);
            router.replace(`/kontrak/${result.id}/edit`);
          }
        } else if (result.conflict) {
          setConflictRevision(result.currentRevision);
          setConflictOpen(true);
        } else {
          setStatusMessage({ type: "error", text: result.message });
          if (result.errors) {
            setFieldErrors(result.errors);
          }
        }
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: err?.message || "Gagal menyimpan berkas kontrak. Periksa koneksi Anda.",
        });
      }
    });
  };

  // Backup JSON locally
  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safePkg = (formData.packageName || "kontrak")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `cadangan-kontrak-${safePkg}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Restore JSON locally
  const handleUploadBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed === "object" && parsed !== null) {
          setFormData((prev) => ({ ...prev, ...parsed }));
          setStatusMessage({
            type: "success",
            text: "Draf berhasil dipulihkan dari berkas cadangan JSON.",
          });
        }
      } catch {
        alert("Berkas JSON cadangan rusak atau tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "identitas", label: "Identitas Paket & Pagu", icon: FileText },
    { key: "penyedia", label: "Penyedia / Rekanan", icon: Building },
    { key: "pejabat", label: "Pejabat Pengadaan & PPK", icon: Users },
    { key: "surat", label: "Surat & Jadwal (18 Dokumen)", icon: Calendar },
    { key: "rab", label: `Tabel RAB (${calculations.itemCount} Item)`, icon: Layers },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Top Navigation & Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/kontrak"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            title="Kembali ke Daftar Kontrak"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {mode === "create" ? "Buat Kontrak Pengadaan Baru" : "Edit Kontrak Pengadaan"}
              </h1>
              {currentContractId && (
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  Revisi #{revision}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Pengadaan Langsung Barang/Jasa Pemerintah &lt; Rp 200 Juta · Bapenda Jember
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* History button if in edit mode */}
          {currentContractId && events.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              title="Lihat Riwayat Perubahan"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Riwayat</span>
            </button>
          )}

          {/* Backup JSON */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            title="Simpan Cadangan JSON ke Komputer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Cadangkan</span>
          </button>

          {/* Restore JSON */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Buka Cadangan</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadBackup}
              className="hidden"
            />
          </label>

          {/* Cetak A4 */}
          {currentContractId && (
            <Link
              href={`/kontrak/${currentContractId}/cetak`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              title="Buka Pratinjau Cetak Standar A4"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Cetak A4</span>
            </Link>
          )}

          {/* Unduh Word .docx */}
          {currentContractId && (
            <a
              href={`/api/export/word/kontrak/${currentContractId}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              title="Unduh 18 Dokumen Resmi Microsoft Word (.docx)"
            >
              <FileDown className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Unduh Word</span>
            </a>
          )}

          {/* Simpan Kontrak Button */}
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isPending ? "Menyimpan..." : "Simpan Kontrak"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Numerical Live Summary Bar */}
      <ContractSummaryBar
        summary={calculations}
        packageName={formData.packageName}
        providerType={formData.providerType}
        providerName={formData.providerName}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-emerald-800 text-emerald-900 bg-emerald-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-emerald-800" : "text-slate-400"
                }`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "identitas" && (
          <IdentitySection
            data={formData}
            onChange={handleInputChange}
            errors={fieldErrors}
          />
        )}

        {activeTab === "penyedia" && (
          <ProviderSection
            data={formData}
            onChange={handleInputChange}
            onBatchChange={handleBatchChange}
            errors={fieldErrors}
          />
        )}

        {activeTab === "pejabat" && (
          <OfficialsSection
            data={formData}
            onChange={handleInputChange}
            onBatchChange={handleBatchChange}
          />
        )}

        {activeTab === "surat" && (
          <LettersSection
            data={formData}
            onChange={handleInputChange}
          />
        )}

        {activeTab === "rab" && (
          <RabSection
            groups={formData.groups || []}
            onChangeGroups={handleGroupsChange}
            vatRate={formData.vatRate}
            errors={fieldErrors}
          />
        )}
      </div>

      {/* Conflict Modal */}
      <ConflictDialog
        isOpen={conflictOpen}
        onClose={() => setConflictOpen(false)}
        onDownloadBackup={handleDownloadBackup}
        onReload={() => window.location.reload()}
        currentRevision={conflictRevision}
      />

      {/* History Modal */}
      <HistoryDialog
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        events={events}
        currentRevision={revision}
      />
    </div>
  );
}
