"use client";

import { useRef } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Download } from "lucide-react";

interface PrintViewerProps {
  html: string;
  contractId: string;
  packageName: string;
}

export function PrintViewer({ html, contractId, packageName }: PrintViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Floating Action Header (Hidden in Print) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/kontrak/${contractId}/edit`}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            title="Kembali ke Formulir Kontrak"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-lg">
              Pratinjau Cetak: {packageName}
            </h1>
            <p className="text-[11px] text-slate-500">
              Tata letak resmi cetak standar A4 Bapenda Jember
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/export/word/kontrak/${contractId}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Unduh Word (.docx)</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Sekarang (A4)</span>
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-[215mm] bg-white shadow-lg border border-slate-300 rounded-sm overflow-hidden min-h-[297mm]">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title={`Pratinjau Cetak - ${packageName}`}
            className="w-full h-[90vh] border-0"
          />
        </div>
      </main>
    </div>
  );
}
