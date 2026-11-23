"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, User, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Left Side: Brand Story & Context */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#122d40] to-[#0b1c28] p-8 text-white flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-[#006d63] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                B
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight leading-tight">
                  BAPENDA
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                  Kabupaten Jember
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Badge variant="default" className="bg-teal-900/60 text-teal-200 border-teal-700/60">
                Administrasi Pengadaan &amp; Belanja
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Kontrak Pengadaan hingga SPJ, terpadu satu tempat.
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kelola paket pengadaan langsung, susun RAB dan negosiasi, teruskan otomatis ke formulir SPJ, dan cetak dokumen resmi dalam satu akun kantor.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-700/60 flex flex-col gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Akses resmi terbatas intranet Bapenda Jember</span>
            </div>
            <span>Badan Pendapatan Daerah Kabupaten Jember &copy; 2026</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Masuk ke Aplikasi
              </h2>
              <p className="text-xs text-slate-500">
                Gunakan nama pengguna dan kata sandi yang telah didaftarkan oleh admin.
              </p>
            </div>

            {state?.message && !state.success && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{state.message}</div>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-1">
                <Input
                  name="username"
                  label="Nama Pengguna"
                  placeholder="Contoh: sendy"
                  required
                  autoComplete="username"
                  autoFocus
                  error={state?.fieldErrors?.username}
                />
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    label="Kata Sandi"
                    placeholder="Masukkan kata sandi akun"
                    required
                    autoComplete="current-password"
                    error={state?.fieldErrors?.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isPending}
                className="w-full mt-2"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Memeriksa Akun…
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            {/* Initial installation credential hint */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-700">Akun Awal Instalasi Server:</span>
              <p>
                Akun administrator bawaan adalah <code className="font-mono font-semibold bg-slate-200/70 px-1 py-0.5 rounded">Sendy</code> dengan kata sandi <code className="font-mono font-semibold bg-slate-200/70 px-1 py-0.5 rounded">Sendyganteng</code>. Segera ubah sandi setelah berhasil masuk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
