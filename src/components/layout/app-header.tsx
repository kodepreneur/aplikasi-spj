"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { 
  Home, 
  FileText, 
  Folder, 
  Users, 
  Archive, 
  BarChart3, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Plus,
  FileSpreadsheet,
  Database,
  Building2,
  UserCheck
} from "lucide-react";
import type { Account } from "@/lib/db/schema";

interface AppHeaderProps {
  user: Account;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [masterDropdownOpen, setMasterDropdownOpen] = React.useState(false);
  const [laporanDropdownOpen, setLaporanDropdownOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  // Close dropdowns when clicking outside
  const headerRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMasterDropdownOpen(false);
        setLaporanDropdownOpen(false);
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHomeActive = pathname === "/";
  const isKontrakActive = pathname.startsWith("/kontrak");
  const isSpjActive = pathname.startsWith("/spj");
  const isMasterActive = pathname.startsWith("/master");
  const isAkunActive = pathname.startsWith("/admin/akun");
  const isMigrasiActive = pathname.startsWith("/admin/migrasi");

  const userInitial = (user.username?.[0] || "U").toUpperCase();
  const userRoleLabel = user.role === "admin" ? "Administrator" : "Pegawai";

  return (
    <header 
      ref={headerRef} 
      className="bg-[#003463] text-white sticky top-0 z-50 shadow-md relative select-none"
    >
      {/* Decorative Golden Wave Accent on Top Right (clipped in its own container) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <svg 
          className="absolute top-0 right-0 h-full w-48 hidden sm:block" 
          viewBox="0 0 192 64" 
          fill="none" 
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path 
            d="M 40,0 C 70,36 120,54 192,42 L 192,0 Z" 
            fill="#fccd01" 
          />
          <path 
            d="M 85,0 C 115,24 148,34 192,24 L 192,0 Z" 
            fill="#f59e0b" 
            opacity="0.4" 
          />
        </svg>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 relative z-10">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-8 h-9 shrink-0 flex items-center justify-center">
              <Image
                src="/logo-jember.png"
                alt="Lambang Kabupaten Jember"
                width={34}
                height={38}
                className="object-contain drop-shadow-xs"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-wider text-white leading-tight uppercase group-hover:text-amber-300 transition-colors">
                BAPENDA JEMBER
              </span>
              <span className="text-[10px] sm:text-[11px] text-sky-200/90 font-normal leading-tight">
                Badan Pendapatan Daerah Kabupaten Jember
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-2">
            {/* Beranda */}
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isHomeActive
                  ? "bg-[#1a56db] text-white shadow-xs"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Beranda</span>
            </Link>

            {/* Kontrak Manual */}
            <Link
              href="/kontrak"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isKontrakActive
                  ? "bg-[#1a56db] text-white shadow-xs"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Kontrak Manual</span>
            </Link>

            {/* SPJ */}
            <Link
              href="/spj"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSpjActive
                  ? "bg-[#1a56db] text-white shadow-xs"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Folder className="h-4 w-4" />
              <span>SPJ</span>
            </Link>

            {/* Master Data (Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMasterDropdownOpen((prev) => !prev);
                  setLaporanDropdownOpen(false);
                  setUserMenuOpen(false);
                  setNotifOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isMasterActive
                    ? "bg-[#1a56db] text-white shadow-xs"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Master Data</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${masterDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {masterDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    href="/master/penyedia"
                    onClick={() => setMasterDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#1a56db] border-b border-slate-50"
                  >
                    <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Data Penyedia</div>
                      <div className="text-[10px] text-slate-400">Rekanan, NPWP &amp; Rekening</div>
                    </div>
                  </Link>
                  <Link
                    href="/master/pejabat"
                    onClick={() => setMasterDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#1a56db]"
                  >
                    <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Data Pejabat</div>
                      <div className="text-[10px] text-slate-400">PA/PPK, PPTK, Pengadaan, Bendahara</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Kelola Akun (Admin) */}
            {user.role === "admin" && (
              <Link
                href="/admin/akun"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isAkunActive
                    ? "bg-[#1a56db] text-white shadow-xs"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Kelola Akun</span>
              </Link>
            )}

            {/* Migrasi & Arsip (Admin) */}
            {user.role === "admin" && (
              <Link
                href="/admin/migrasi"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isMigrasiActive
                    ? "bg-[#1a56db] text-white shadow-xs"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Archive className="h-4 w-4" />
                <span>Migrasi &amp; Arsip</span>
              </Link>
            )}

            {/* Laporan (Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLaporanDropdownOpen((prev) => !prev);
                  setUserMenuOpen(false);
                  setNotifOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Laporan</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${laporanDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {laporanDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    href="/#rekapitulasi"
                    onClick={() => setLaporanDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a56db]"
                  >
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span>Rekapitulasi Dokumen</span>
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin/migrasi"
                      onClick={() => setLaporanDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a56db]"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span>Ekspor Data Arsip</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: Notification Bell & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setUserMenuOpen(false);
                setLaporanDropdownOpen(false);
              }}
              className="relative p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Notifikasi"
              aria-label="Pemberitahuan sistem"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs">
                0
              </span>
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Pemberitahuan</span>
                  <span className="text-[10px] text-slate-400">0 Baru</span>
                </div>
                <div className="py-6 text-center text-xs text-slate-500">
                  Semua dokumen terkini dan tersinkronisasi.
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setNotifOpen(false);
                setLaporanDropdownOpen(false);
              }}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-white/10 transition-colors text-left cursor-pointer group"
              aria-expanded={userMenuOpen}
            >
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.username}
                  className="h-8 w-8 rounded-full object-cover border border-slate-300"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="hidden sm:flex flex-col pr-1">
                <span className="text-xs font-semibold text-white leading-tight group-hover:text-amber-300 transition-colors">
                  {user.username}
                </span>
                <span className="text-[10px] text-sky-200/90 font-normal leading-tight capitalize">
                  {userRoleLabel}
                </span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.username}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{userRoleLabel}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a56db]"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    <span>Profil Saya</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin/akun"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1a56db]"
                    >
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>Kelola Akun</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100 px-2">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#002b54] px-4 py-3 space-y-1 relative z-20">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
              isHomeActive ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Beranda</span>
          </Link>

          <Link
            href="/kontrak"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
              isKontrakActive ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Kontrak Manual</span>
          </Link>

          <Link
            href="/spj"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
              isSpjActive ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <Folder className="h-4 w-4" />
            <span>Daftar SPJ Belanja</span>
          </Link>

          <Link
            href="/spj/baru"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/10 pl-8"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Buat SPJ Baru</span>
          </Link>

          {/* Master Data in Mobile */}
          <div className="pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sky-300/80 px-3">
            Master Data
          </div>
          <Link
            href="/master/penyedia"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
              pathname.startsWith("/master/penyedia") ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>Data Penyedia &amp; Rekanan</span>
          </Link>
          <Link
            href="/master/pejabat"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
              pathname.startsWith("/master/pejabat") ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <UserCheck className="h-4 w-4 text-blue-400" />
            <span>Data Pejabat Penandatangan</span>
          </Link>

          {user.role === "admin" && (
            <>
              <Link
                href="/admin/akun"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                  isAkunActive ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Kelola Akun</span>
              </Link>
              <Link
                href="/admin/migrasi"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                  isMigrasiActive ? "bg-[#1a56db] text-white" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Archive className="h-4 w-4" />
                <span>Migrasi &amp; Arsip</span>
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-white/10">
            <Link
              href="/profil"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              <UserIcon className="h-4 w-4" />
              <span>Profil Saya</span>
            </Link>
            <form action={logoutAction} className="mt-1">
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/20 text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Akun</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
