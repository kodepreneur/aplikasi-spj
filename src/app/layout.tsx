import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/layout/header-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPJ & Kontrak Pengadaan Langsung · Bapenda Jember",
  description:
    "Sistem Terpadu Pengelolaan Kontrak Pengadaan Langsung dan Surat Pertanggungjawaban (SPJ) Belanja Daerah - Bapenda Kabupaten Jember",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#eff5fc] text-slate-900">
        {/* Render Header with Suspense boundary */}
        <HeaderWrapper />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative z-0">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-3.5 text-xs text-slate-500">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Badan Pendapatan Daerah Kabupaten Jember &copy; 2026</span>
            <span>Sistem Otomatisasi Administrasi Pengadaan &amp; Belanja Daerah</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
