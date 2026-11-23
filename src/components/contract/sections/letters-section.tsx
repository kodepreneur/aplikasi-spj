"use client";

import type { ChangeEvent } from "react";
import { Calendar, FileCheck, Hash } from "lucide-react";

interface LettersSectionProps {
  data: Record<string, any>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function LettersSection({ data, onChange }: LettersSectionProps) {
  return (
    <div className="space-y-6">
      {/* Group 1: Persiapan dan Undangan */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-4 h-4 text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900">
            1. Tahap Persiapan & Undangan
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Dokumen awal perencanaan pengadaan, HPS, dan undangan kepada rekanan.
        </p>

        <div className="space-y-4 divide-y divide-slate-100">
          {/* 1. Nota Dinas PPTK ke PPK */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 first:pt-0 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Nota Dinas PPTK kepada PPK
              </p>
              <p className="text-[11px] text-slate-500">
                Isian tahapan lembar awal
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="pptkNoteNumber"
                  value={data.pptkNoteNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor Surat..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="pptkNoteDate"
                value={data.pptkNoteDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 2. HPS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Harga Perkiraan Sendiri (HPS)
              </p>
              <p className="text-[11px] text-slate-500">
                Penetapan nilai kalkulasi teknis HPS
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Mengikuti tanggal penetapan HPS)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="hpsDate"
                value={data.hpsDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 3. Nota Dinas PPK ke Pejabat Pengadaan */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Nota Dinas PPK kepada Pejabat Pengadaan
              </p>
              <p className="text-[11px] text-slate-500">
                Permohonan proses pemilihan penyedia
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="ppkNoteNumber"
                  value={data.ppkNoteNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor Surat..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="ppkNoteDate"
                value={data.ppkNoteDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 4. Penetapan Spesifikasi Teknis */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Penetapan Spesifikasi Teknis
              </p>
              <p className="text-[11px] text-slate-500">
                Kerangka acuan kerja & spesifikasi
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Tanpa nomor surat)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="specificationDate"
                value={data.specificationDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 5. Undangan Pengadaan Langsung */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Undangan Pengadaan Langsung
              </p>
              <p className="text-[11px] text-slate-500">
                Dirujuk pada penawaran dan rujukan SPK
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="invitationNumber"
                  value={data.invitationNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor Surat Undangan..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="invitationDate"
                value={data.invitationDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 6. Pemasukan Dokumen Penawaran */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Pemasukan Dokumen Penawaran
              </p>
              <p className="text-[11px] text-slate-500">
                Batas akhir jadwal pemasukan penawaran
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Jadwal pada surat undangan)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="submissionDate"
                value={data.submissionDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 7. Klarifikasi Teknis dan Negosiasi Harga */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Jadwal Klarifikasi Teknis & Negosiasi
              </p>
              <p className="text-[11px] text-slate-500">
                Jadwal tercantum pada surat undangan
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Jadwal pada surat undangan)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="negotiationScheduleDate"
                value={data.negotiationScheduleDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Surat Penyedia dan Berita Acara */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-4 h-4 text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900">
            2. Tahap Dokumen Rekanan & Berita Acara
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Surat penawaran rekanan, pembukaan, klarifikasi teknis, dan penetapan pemenang.
        </p>

        <div className="space-y-4 divide-y divide-slate-100">
          {/* 8. Surat Penawaran Harga */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 first:pt-0 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Surat Penawaran Harga Rekanan
              </p>
              <p className="text-[11px] text-slate-500">
                Dirujuk pada SPPBJ dan BA Evaluasi
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Tanggal penawaran rekanan)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="offerDate"
                value={data.offerDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 9. Surat Pernyataan Minat */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Surat Pernyataan Minat
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Tanggal pernyataan minat)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="interestDate"
                value={data.interestDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 10. Pakta Integritas */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Pakta Integritas Rekanan
              </p>
            </div>
            <div className="md:col-span-4 text-xs text-slate-400 italic">
              (Tanggal pakta integritas)
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="integrityDate"
                value={data.integrityDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 11. BA Pembukaan Penawaran */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                BA Pembukaan Dokumen Penawaran
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="openingNumber"
                  value={data.openingNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor BA..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="openingDate"
                value={data.openingDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 12. BA Klarifikasi & Negosiasi */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                BA Klarifikasi & Negosiasi Harga
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="negotiationNumber"
                  value={data.negotiationNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor BA..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="negotiationDate"
                value={data.negotiationDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 13. BAHPL */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                BA Hasil Pengadaan Langsung (BAHPL)
              </p>
              <p className="text-[11px] text-slate-500">
                Dirujuk pada penetapan, nota penyampaian, & SPK
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="bahplNumber"
                  value={data.bahplNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor BAHPL..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="bahplDate"
                value={data.bahplDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 14. BA Penetapan Pemenang */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                BA Penetapan Pemenang Penyedia
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="awardNumber"
                  value={data.awardNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor BA..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="awardDate"
                value={data.awardDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Group 3: Hasil Pengadaan dan Kontrak */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-4 h-4 text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900">
            3. Hasil Pengadaan & Kontrak Resmi (SPK)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Pengumuman, penyampaian hasil pengadaan, penunjukan resmi (SPPBJ), dan Surat Perintah Kerja (SPK).
        </p>

        <div className="space-y-4 divide-y divide-slate-100">
          {/* 15. Pengumuman Hasil Pengadaan */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 first:pt-0 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Pengumuman Hasil Pengadaan Langsung
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="announcementNumber"
                  value={data.announcementNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor Pengumuman..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="announcementDate"
                value={data.announcementDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 16. Nota Dinas Penyampaian BA */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Nota Dinas Penyampaian BA Pengadaan
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="deliveryNoteNumber"
                  value={data.deliveryNoteNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor Nota Dinas..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="deliveryNoteDate"
                value={data.deliveryNoteDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 17. SPPBJ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Surat Penunjukan Penyedia Barang/Jasa (SPPBJ)
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="sppbjNumber"
                  value={data.sppbjNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor SPPBJ..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="sppbjDate"
                value={data.sppbjDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 18. SPK */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-slate-800">
                Surat Perintah Kerja (SPK)
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Kontrak final pelaksanaan pekerjaan
              </p>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                <input
                  type="text"
                  name="spkNumber"
                  value={data.spkNumber || ""}
                  onChange={onChange}
                  placeholder="Nomor SPK..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                name="spkDate"
                value={data.spkDate || ""}
                onChange={onChange}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
