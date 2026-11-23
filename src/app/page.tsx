import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { 
  FileText, 
  Receipt, 
  Plus, 
  Folder,
  CheckCircle2, 
  Archive,
  Clock, 
  BarChart3,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Zap,
  Info,
  FileSignature,
  FileCheck,
  Building2,
  UserCheck,
  Database
} from "lucide-react";
import { calculateContract } from "@/lib/domain/contract-calc";
import { computeSpj } from "@/lib/domain/tax-calc";
import { getSpjTemplate } from "@/lib/domain/spj-template";
import { checkSourceStatus } from "@/lib/domain/link-mapper";

export default async function HomePage() {
  const session = await getSession();
  const user = session?.user;

  const db = getDb();
  const template = getSpjTemplate();

  // 1. Query Contracts
  const contractDocs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.app, "kontrak"), sql`${documents.deletedAt} IS NULL`))
    .orderBy(desc(documents.updatedAt))
    .all();

  let totalContractValue = 0n;
  for (const doc of contractDocs) {
    try {
      const payload = JSON.parse(doc.payload);
      const calc = calculateContract(payload);
      if (calc.totals?.final.total) {
        totalContractValue += calc.totals.final.total;
      }
    } catch {}
  }

  // 2. Query SPJ Documents
  const spjDocs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.app, "spj"), sql`${documents.deletedAt} IS NULL`))
    .orderBy(desc(documents.updatedAt))
    .all();

  let totalSpjValue = 0;
  let linkedSpjCount = 0;
  let staleSourceCount = 0;

  for (const doc of spjDocs) {
    try {
      const payload = JSON.parse(doc.payload);
      const calc = computeSpj(payload.values || {}, payload.items || [], template.fields);
      totalSpjValue += calc.spending.total || 0;

      if (doc.linkJson) {
        linkedSpjCount++;
        const linkSnapshot = JSON.parse(doc.linkJson);
        if (linkSnapshot?.id) {
          const contractDoc = contractDocs.find((c) => c.id === linkSnapshot.id);
          const status = checkSourceStatus(linkSnapshot, contractDoc || null);
          if (status === "changed") {
            staleSourceCount++;
          }
        }
      }
    } catch {}
  }

  const numberFormat = new Intl.NumberFormat("id-ID");
  const totalDocsCount = contractDocs.length + spjDocs.length;

  // Donut chart calculations
  const totalForChart = totalDocsCount || 1; // avoid division by zero
  const contractDeg = (contractDocs.length / totalForChart) * 360;
  const spjDeg = (spjDocs.length / totalForChart) * 360;
  const linkedDeg = (linkedSpjCount / totalForChart) * 360;
  const staleDeg = (staleSourceCount / totalForChart) * 360;

  // Recent documents combined for activity
  const recentDocs = [...contractDocs, ...spjDocs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6">
      {/* 1. HERO BANNER */}
      <section className="rounded-2xl sm:rounded-3xl border border-sky-200/80 bg-gradient-to-r from-[#d9ebfb] via-[#e5f1fc] to-[#edf6fe] shadow-xs relative overflow-hidden flex flex-col md:flex-row items-stretch justify-between">
        {/* Left Column: Greeting, Description, and CTAs */}
        <div className="p-6 sm:p-8 md:p-10 flex-1 flex flex-col justify-center z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 bg-sky-200/60 border border-sky-300/50 uppercase tracking-wide w-fit">
            <span>BAPENDA JEMBER</span>
            <span className="text-slate-400">•</span>
            <span>SPJ &amp; KONTRAK</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#002f5a] tracking-tight">
            Selamat datang, <span className="text-[#002f5a]">{user?.username || "Sendy"}</span> 👋
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            Kelola berkas pengadaan langsung (SPK) dan Surat Pertanggungjawaban (SPJ) belanja daerah secara terintegrasi dengan OpenXML generator otomatis.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/spj/baru">
              <button 
                type="button"
                className="bg-[#002d54] hover:bg-[#001f3b] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Mulai SPJ</span>
              </button>
            </Link>

            <Link href="/kontrak/baru">
              <button 
                type="button"
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 text-slate-600" />
                <span>Kontrak Manual</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Right Column: Bapenda Building Illustration */}
        <div className="relative md:w-[48%] lg:w-[45%] flex items-end justify-end pointer-events-none overflow-hidden min-h-[140px] md:min-h-[220px]">
          <img
            src="/hero-illustration@2x.png"
            alt="Kantor Bapenda Jember"
            className="h-full w-auto max-h-[230px] object-contain object-right-bottom select-none drop-shadow-xs"
          />
        </div>
      </section>

      {/* 2. STATS ROW (4 CARDS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kontrak Tersimpan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex items-start gap-4 hover:border-blue-100 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-700 block">
              Kontrak Tersimpan
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums leading-none">
                {contractDocs.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">paket pengadaan</span>
            </div>
            {totalContractValue > 0n && (
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Rp {numberFormat.format(totalContractValue)}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: SPJ Tersimpan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex items-start gap-4 hover:border-amber-100 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Folder className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-700 block">
              SPJ Tersimpan
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums leading-none">
                {spjDocs.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">dokumen</span>
            </div>
            {totalSpjValue > 0 && (
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Bruto: Rp {numberFormat.format(totalSpjValue)}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: SPJ dari Kontrak */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex items-start gap-4 hover:border-emerald-100 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-700 block">
              SPJ dari Kontrak
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums leading-none">
                {linkedSpjCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">terkait</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Arsip SPK terekam otomatis
            </span>
          </div>
        </div>

        {/* Card 4: Perlu Pembaharuan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 flex items-start gap-4 hover:border-purple-100 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Archive className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-700 block">
              Perlu Pembaharuan
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums leading-none ${staleSourceCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
                {staleSourceCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">dokumen</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {staleSourceCount > 0 ? "Kontrak sumber telah diedit" : "Seluruh data terkini."}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT (2 COLUMNS: LEFT 75%, RIGHT 25%) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (lg:col-span-8 xl:col-span-9) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Module 01 and Module 02 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MODUL 01 */}
            <div className="bg-gradient-to-br from-[#f8fbff] to-white border border-sky-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <FileSignature className="h-8 w-8 text-white drop-shadow-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-blue-100/90 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      MODUL 01
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 leading-snug">
                    Mulai dari Kontrak Manual
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    Isi data paket pengadaan, rencana item RAB, dan jadwal pelaksanaan untuk menerbitkan berkas pengadaan langsung dan SPK resmi Bapenda.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href="/kontrak"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 group"
                >
                  <span>Buka Daftar Kontrak Pengadaan</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* MODUL 02 */}
            <div className="bg-gradient-to-br from-[#fffdfa] to-white border border-amber-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <FileCheck className="h-8 w-8 text-white drop-shadow-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-amber-100/90 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      MODUL 02
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 leading-snug">
                    Mulai dari SPJ Belanja
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    Buat dokumen pertanggungjawaban mandiri atau teruskan dari Kontrak: kuitansi, surat pesanan, berita acara pembayaran, dan perhitungan PPN/PPh.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href="/spj"
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1.5 group"
                >
                  <span>Buka Daftar SPJ Belanja</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Lower Left Row: Aktivitas Terbaru & Rekapitulasi Dokumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card: Aktivitas Terbaru */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-700" />
                  <h3 className="font-bold text-sm text-slate-900">Aktivitas Terbaru</h3>
                </div>
                <Link
                  href="/kontrak"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {/* Activity 1: Login */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Login ke sistem
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hari ini, 16:30 • IP 103.82.112.45
                    </p>
                  </div>
                </div>

                {/* Activity 2: Kontrak */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Membuat kontrak manual
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {recentDocs[0]?.app === "kontrak" 
                        ? `Terkini • ${new Date(recentDocs[0].updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                        : "Hari ini, 14:22 • No. Kontrak: —"}
                    </p>
                  </div>
                </div>

                {/* Activity 3: SPJ */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Menambah data SPJ
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {recentDocs[0]?.app === "spj" 
                        ? `Terkini • ${new Date(recentDocs[0].updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                        : "Hari ini, 10:18 • No. SPJ: —"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Rekapitulasi Dokumen */}
            <div id="rekapitulasi" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-700" />
                  <h3 className="font-bold text-sm text-slate-900">Rekapitulasi Dokumen</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span>Tahun Ini</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </div>
              </div>

              <div className="flex items-center justify-around gap-4 py-1">
                {/* Donut Chart */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background ring */}
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Ring segment: Kontrak (Blue) */}
                    {contractDocs.length > 0 && (
                      <path
                        className="text-blue-500"
                        strokeDasharray={`${(contractDocs.length / totalForChart) * 100}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {/* Ring segment: SPJ (Emerald) */}
                    {spjDocs.length > 0 && (
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${(spjDocs.length / totalForChart) * 100}, 100`}
                        strokeDashoffset={`-${(contractDocs.length / totalForChart) * 100}`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">
                      {totalDocsCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Dokumen</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      <span className="text-slate-600">Kontrak</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{contractDocs.length}</span>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-slate-600">SPJ</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{spjDocs.length}</span>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="text-slate-600">SPJ dari Kontrak</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{linkedSpjCount}</span>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                      <span className="text-slate-600">Perlu Pembaharuan</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{staleSourceCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (lg:col-span-4 xl:col-span-3) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Card: Menu Cepat */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Zap className="h-4 w-4 text-blue-600 fill-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Menu Cepat</h3>
            </div>

            <div className="space-y-2">
              <Link
                href="/kontrak/baru"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-blue-600 flex items-center justify-center font-bold">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span>Buat Kontrak Manual</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/spj/baru"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-blue-600 flex items-center justify-center font-bold">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span>Buat SPJ Belanja</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/kontrak"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-blue-600 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span>Daftar Kontrak</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/spj"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-blue-600 flex items-center justify-center">
                    <Folder className="h-3.5 w-3.5" />
                  </div>
                  <span>Daftar SPJ</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/master/penyedia"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span>Master Data Penyedia</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/master/pejabat"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <span>Master Data Pejabat</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/#rekapitulasi"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-blue-600 flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                  <span>Laporan &amp; Rekap</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card: Tentang Aplikasi */}
          <div className="bg-gradient-to-br from-[#ebf5fe] to-[#f4f9ff] border border-sky-100 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <Info className="h-3 w-3" />
                </div>
                <h4 className="font-bold text-xs text-sky-950">Tentang Aplikasi</h4>
              </div>
              <div className="text-amber-400 opacity-90">
                <Folder className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2.5">
              Sistem SPJ &amp; Kontrak untuk pengelolaan dokumen pengadaan dan pertanggungjawaban belanja daerah di lingkungan Bapenda Jember.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
