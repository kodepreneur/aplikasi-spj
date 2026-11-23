"use client";

import { useState, useMemo, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Download,
  Upload,
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
  RefreshCw,
} from "lucide-react";
import { saveSpjAction, syncSpjFromContractAction } from "@/app/actions/spj";
import {
  computeSpj,
  type SpjItemInput,
  type SpjCalculationResult,
} from "@/lib/domain/tax-calc";
import type { SpjSourceSnapshot, SourceStatus } from "@/lib/domain/link-mapper";
import type { Event } from "@/lib/db/schema";
import { SpjSummaryBar } from "./spj-summary-bar";
import { SpjSourceBanner } from "./spj-source-banner";
import { ActivitySection } from "./sections/activity-section";
import { DatesSection } from "./sections/dates-section";
import { ProviderSection } from "./sections/provider-section";
import { OfficialsSection } from "./sections/officials-section";
import { SpendingSection } from "./sections/spending-section";
import { ConflictDialog } from "@/components/contract/conflict-dialog";
import { HistoryDialog } from "@/components/contract/history-dialog";

export interface SpjFormProps {
  mode: "create" | "edit";
  initialValues: Record<string, any>;
  initialItems: SpjItemInput[];
  spjId?: string;
  initialRevision?: number;
  linkSnapshot?: SpjSourceSnapshot | null;
  sourceStatus?: SourceStatus;
  canEdit?: boolean;
  events?: Event[];
  templateFields?: { key: string; value: string; group: string; label: string }[];
}

type TabKey = "kegiatan" | "tanggal" | "penyedia" | "pejabat" | "rincian";

export function SpjForm({
  mode,
  initialValues,
  initialItems,
  spjId,
  initialRevision = 1,
  linkSnapshot = null,
  sourceStatus = "none",
  canEdit = true,
  events = [],
  templateFields = [],
}: SpjFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  const [values, setValues] = useState<Record<string, any>>(() => ({
    ...initialValues,
  }));
  const [items, setItems] = useState<SpjItemInput[]>(() =>
    initialItems.length > 0
      ? initialItems
      : [{ description: "", detail: "", unit: "Paket", quantity: "1", unitPrice: "0" }]
  );

  const [activeTab, setActiveTab] = useState<TabKey>("kegiatan");
  const [revision, setRevision] = useState<number>(initialRevision);
  const [currentSpjId, setCurrentSpjId] = useState<string | undefined>(spjId);
  const [currentLinkSnapshot, setCurrentLinkSnapshot] = useState<SpjSourceSnapshot | null>(linkSnapshot);
  const [currentSourceStatus, setCurrentSourceStatus] = useState<SourceStatus>(sourceStatus);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dialogs
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictRevision, setConflictRevision] = useState<number | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isLinked = Boolean(currentLinkSnapshot?.id);

  // Live calculation
  const calculations: SpjCalculationResult = useMemo(() => {
    try {
      return computeSpj(values, items, templateFields);
    } catch {
      return {
        spending: {
          items: [],
          rate: 0.11,
          basis: "included",
          base: 0,
          ppn: 0,
          total: 0,
          subtotal: 0,
          errors: ["Format angka atau rincian belum lengkap."],
        },
        pph: {
          type: "none",
          label: "Tanpa PPh",
          rate: 0,
          base: 0,
          amount: 0,
          errors: [],
        },
        net: 0,
        data: {},
        errors: ["Terjadi kesalahan perhitungan formulir SPJ."],
      };
    }
  }, [values, items, templateFields]);

  // Generic value change
  const handleValueChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchValueChange = (updates: Record<string, any>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  };

  // Sync from Contract
  const handleSync = async () => {
    if (!currentSpjId) return;
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const res = await syncSpjFromContractAction(currentSpjId);
      if (res.success && res.updatedData) {
        setValues(res.updatedData.values);
        setItems(res.updatedData.items);
        setCurrentSourceStatus("current");
        setRevision((prev) => prev + 1);
        setStatusMessage({
          type: "success",
          text: "Data SPJ berhasil disinkronkan dengan pembaruan Kontrak sumber.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "Gagal menyinkronkan data dari kontrak.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Terjadi kesalahan saat menyinkronkan data.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Save SPJ
  const handleSave = () => {
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const result = await saveSpjAction({
          id: currentSpjId || null,
          payload: {
            values,
            items,
          },
          linkJson: currentLinkSnapshot,
          expectedRevision: currentSpjId ? revision : undefined,
        });

        if (result.success) {
          setStatusMessage({ type: "success", text: result.message });
          if (result.revision) {
            setRevision(result.revision);
          }
          if (result.id && !currentSpjId) {
            setCurrentSpjId(result.id);
            router.replace(`/spj/${result.id}/edit`);
          }
        } else if (result.conflict) {
          setConflictRevision(result.currentRevision);
          setConflictOpen(true);
        } else {
          setStatusMessage({
            type: "error",
            text: result.message + (result.errors?.length ? ` (${result.errors.join(", ")})` : ""),
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: err?.message || "Gagal menyimpan berkas SPJ. Periksa koneksi Anda.",
        });
      }
    });
  };

  // Backup JSON locally
  const handleDownloadBackup = () => {
    const backupObj = {
      values,
      items,
      linkSnapshot: currentLinkSnapshot,
      savedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (values.pekerjaan || "spj")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    link.href = url;
    link.download = `cadangan-spj-${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
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
          if (parsed.values) setValues(parsed.values);
          if (parsed.items) setItems(parsed.items);
          if (parsed.linkSnapshot) setCurrentLinkSnapshot(parsed.linkSnapshot);
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
    { key: "kegiatan", label: "Kegiatan & Anggaran", icon: FileText },
    { key: "tanggal", label: "18 Tanggal Pelaksanaan", icon: Calendar },
    { key: "penyedia", label: "Penyedia & Bank", icon: Building },
    { key: "pejabat", label: "Pejabat & SK", icon: Users },
    { key: "rincian", label: "Rincian Belanja & Pajak", icon: Layers },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/spj"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            title="Kembali ke Daftar SPJ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 line-clamp-1">
                {values.pekerjaan || (mode === "create" ? "Buat SPJ Baru" : "Formulir SPJ")}
              </h1>
              {currentSpjId && (
                <span className="text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                  Revisi #{revision}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pertanggungjawaban Belanja Bapenda Jember · {values.tahun_anggaran || "2026"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* JSON Backup */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Simpan cadangan formulir lokal dalam format JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Cadangkan</span>
          </button>

          {/* JSON Restore */}
          <label
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Pulihkan formulir dari berkas cadangan JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Pulihkan</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadBackup}
              className="hidden"
            />
          </label>

          {/* History */}
          {events.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Lihat riwayat revisi dan audit trail"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Riwayat</span>
            </button>
          )}

          {/* Word Download (.docx) */}
          {currentSpjId && (
            <div className="relative group">
              {currentSourceStatus === "changed" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold rounded-lg cursor-not-allowed"
                  title="Perbarui dari kontrak sebelum mengunduh Word"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh Word</span>
                </button>
              ) : (
                <a
                  href={`/api/export/word/spj/${currentSpjId}`}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                  title="Unduh Berkas SPJ Word (.docx)"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh Word</span>
                </a>
              )}
            </div>
          )}

          {/* Save Button */}
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-800/60 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isPending ? "Menyimpan..." : "Simpan Dokumen"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <p className="font-medium">{statusMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Source Status Banner */}
      {currentLinkSnapshot && (
        <SpjSourceBanner
          source={currentLinkSnapshot}
          status={currentSourceStatus}
          onSync={handleSync}
          isSyncing={isSyncing}
        />
      )}

      {/* Live Financial Summary Bar */}
      <SpjSummaryBar
        spending={calculations.spending}
        pph={calculations.pph}
        net={calculations.net}
        terbilangWords={calculations.data?.terbilang_total || ""}
        errors={calculations.errors}
      />

      {/* Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "kegiatan" && (
          <ActivitySection
            values={values}
            onChange={handleValueChange}
            isLinked={isLinked}
            errors={calculations.errors}
          />
        )}

        {activeTab === "tanggal" && (
          <DatesSection
            values={values}
            onChange={handleValueChange}
            isLinked={isLinked}
          />
        )}

        {activeTab === "penyedia" && (
          <ProviderSection
            values={values}
            onChange={handleValueChange}
            onBatchChange={handleBatchValueChange}
            isLinked={isLinked}
          />
        )}

        {activeTab === "pejabat" && (
          <OfficialsSection
            values={values}
            onChange={handleValueChange as any}
            onBatchChange={handleBatchValueChange}
            isLinked={isLinked}
          />
        )}

        {activeTab === "rincian" && (
          <SpendingSection
            items={items}
            onChangeItems={setItems}
            priceBasis={values.price_basis || "included"}
            onChangePriceBasis={(basis) =>
              setValues((prev) => ({ ...prev, price_basis: basis }))
            }
            vatRate={values.ppn_rate || "11"}
            onChangeVatRate={(rate) =>
              setValues((prev) => ({ ...prev, ppn_rate: rate }))
            }
            pphType={values.pph_type || "23"}
            onChangePphType={(type) =>
              setValues((prev) => ({ ...prev, pph_type: type }))
            }
            pphRate={values.pph_rate || "2"}
            onChangePphRate={(rate) =>
              setValues((prev) => ({ ...prev, pph_rate: rate }))
            }
            spending={calculations.spending}
            pph={calculations.pph}
            isLinked={isLinked}
          />
        )}
      </div>

      {/* OCC Conflict Dialog */}
      <ConflictDialog
        isOpen={conflictOpen}
        onClose={() => setConflictOpen(false)}
        onDownloadBackup={handleDownloadBackup}
        onReload={() => window.location.reload()}
        currentRevision={conflictRevision}
        documentType="SPJ"
      />

      {/* Audit Trail History Dialog */}
      <HistoryDialog
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        events={events}
        currentRevision={revision}
      />
    </div>
  );
}
