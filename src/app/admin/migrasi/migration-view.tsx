"use client";

import { useState, useTransition, type ChangeEvent, type DragEvent } from "react";
import {
  Upload,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Receipt,
  Download,
  Clock,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  parseArchiveFileAction,
  executeImportArchiveAction,
} from "@/app/actions/import";
import type { ImportResult } from "@/lib/domain/legacy-import";

interface MigrationViewProps {
  stats: {
    contractCount: number;
    spjCount: number;
    eventCount: number;
    legacyCount: number;
  };
}

export function MigrationView({ stats: initialStats }: MigrationViewProps) {
  const [stats, setStats] = useState(initialStats);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const [archiveInfo, setArchiveInfo] = useState<{
    app: "kontrak" | "spj";
    format: string;
    version: number;
    recordCount: number;
  } | null>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleProcessFile = (file: File) => {
    setParseError(null);
    setImportResult(null);
    setArchiveInfo(null);

    if (!file.name.endsWith(".json")) {
      setParseError("Harap pilih berkas berekstensi .json.");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        setFileContent(text);

        const check = await parseArchiveFileAction(text);
        if (check.success && check.app && check.format && check.version && check.recordCount) {
          setArchiveInfo({
            app: check.app,
            format: check.format,
            version: check.version,
            recordCount: check.recordCount,
          });
        } else {
          setParseError(check.message || "Format arsip JSON tidak valid.");
        }
      } catch {
        setParseError("Gagal membaca berkas JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleImport = () => {
    if (!archiveInfo || !fileContent) return;

    startTransition(async () => {
      try {
        const result = await executeImportArchiveAction(archiveInfo.app, fileContent);
        setImportResult(result);
        if (result.success) {
          setStats((prev) => ({
            ...prev,
            contractCount:
              archiveInfo.app === "kontrak"
                ? prev.contractCount + result.imported
                : prev.contractCount,
            spjCount:
              archiveInfo.app === "spj"
                ? prev.spjCount + result.imported
                : prev.spjCount,
            legacyCount: prev.legacyCount + result.imported,
          }));
        }
      } catch (err: any) {
        setParseError(err?.message || "Gagal memproses pengimporan arsip.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Migrasi & Cadangan Sistem
            </h1>
            <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Impor berkas arsip offline (SPJ_REKAP_OFFLINE & BAPENDA_KONTRAK_ARSIP_OFFLINE) dan cadangan basis data lengkap.
          </p>
        </div>

        <a
          href="/api/backup"
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-800" />
          <span>Cadangkan Seluruh Sistem (.json)</span>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileText className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-medium">Kontrak Manual</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.contractCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dokumen aktif</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Receipt className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-medium">SPJ Belanja</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.spjCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dokumen aktif</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium">Riwayat Audit</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.eventCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total entri audit log</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-medium">Dokumen Terimpor</span>
          </div>
          <div className="text-2xl font-bold text-purple-800 font-mono">
            {stats.legacyCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari arsip offline lama</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Unggah Berkas Arsip Offline (.json)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sistem mendukung impor arsip batch hingga 3.000 dokumen. Duplikasi akan dilewati secara otomatis berbasis verifikasi hash SHA-256.
          </p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 text-center transition-all bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center cursor-pointer relative"
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Seret dan lepas berkas JSON arsip ke sini, atau klik untuk memilih berkas
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Format yang didukung: SPJ_REKAP_OFFLINE (v1, v2) dan BAPENDA_KONTRAK_ARSIP_OFFLINE (v1)
          </p>
        </div>

        {/* File Analysis Result */}
        {parseError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {archiveInfo && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-emerald-800" />
                <span className="font-bold text-sm text-slate-900">
                  {fileName}
                </span>
                <span className="text-xs text-slate-400 font-mono">({fileSize})</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                Format Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Modul Tujuan</span>
                <span className="font-bold text-slate-900 capitalize">{archiveInfo.app}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tipe Format</span>
                <span className="font-mono text-slate-900 text-[11px]">{archiveInfo.format}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Versi Arsip</span>
                <span className="font-mono text-slate-900">v{archiveInfo.version}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Jumlah Dokumen</span>
                <span className="font-bold text-emerald-800 font-mono text-sm">
                  {archiveInfo.recordCount} Dokumen
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-800/60 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor Arsip...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Impor ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Import Results Banner */}
        {importResult && (
          <div
            className={`p-5 rounded-xl border space-y-3 text-xs ${
              importResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>{importResult.message}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-slate-600 block text-[10px] uppercase">Berhasil Diimpor</span>
                <span className="text-base font-bold text-emerald-800">
                  {importResult.imported}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-slate-600 block text-[10px] uppercase">Dilewati (Duplikat Identik)</span>
                <span className="text-base font-bold text-slate-700">
                  {importResult.skipped}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-slate-600 block text-[10px] uppercase">Konflik Perbedaan Data</span>
                <span className="text-base font-bold text-amber-700">
                  {importResult.conflicts.length}
                </span>
              </div>
            </div>

            {importResult.conflicts.length > 0 && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200 text-slate-700 text-[11px] space-y-1">
                <span className="font-semibold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  ID Dokumen yang mengalami konflik (modifikasi berbeda pada ID yang sama):
                </span>
                <div className="max-h-24 overflow-y-auto font-mono text-[10px] text-slate-500">
                  {importResult.conflicts.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
