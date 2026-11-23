"use client";

import { useActionState, useState, useRef } from "react";
import { changePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { KeyRound, Camera, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import type { Account } from "@/lib/db/schema";

interface ProfileFormProps {
  user: Account;
}

export function ProfileForm({ user }: ProfileFormProps) {
  // Password state
  const [pwdState, pwdAction, pwdPending] = useActionState(changePasswordAction, null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Photo state
  const [photoState, photoAction, photoPending] = useActionState(updateProfileAction, null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo || null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Pilih berkas gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 200 * 1024) {
      setPhotoError("Ukuran berkas melebihi batas 200 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Ganti Kata Sandi */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#006d63]" />
            <CardTitle>Ganti Kata Sandi</CardTitle>
          </div>
          <CardDescription>
            Kata sandi baru wajib memiliki panjang minimal 12 karakter untuk mematuhi standar keamanan kantor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pwdState?.message && (
            <div
              className={`p-3.5 rounded-lg mb-4 text-xs flex items-start gap-2.5 ${
                pwdState.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {pwdState.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{pwdState.message}</span>
            </div>
          )}

          <form action={pwdAction} className="space-y-4">
            <div className="relative">
              <Input
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                label="Kata Sandi Saat Ini"
                placeholder="Masukkan kata sandi saat ini"
                required
                error={pwdState?.fieldErrors?.currentPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                name="newPassword"
                type={showNew ? "text" : "password"}
                label="Kata Sandi Baru"
                placeholder="Minimal 12 karakter"
                required
                hint="Minimal 12 karakter gabungan huruf, angka, atau simbol"
                error={pwdState?.fieldErrors?.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div>
              <Input
                name="confirmPassword"
                type="password"
                label="Konfirmasi Kata Sandi Baru"
                placeholder="Ketik ulang kata sandi baru"
                required
                error={pwdState?.fieldErrors?.confirmPassword}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={pwdPending}
              className="mt-2"
            >
              {pwdPending ? "Menyimpan Kata Sandi…" : "Perbarui Kata Sandi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Card 2: Foto Profil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#006d63]" />
            <CardTitle>Foto Profil</CardTitle>
          </div>
          <CardDescription>
            Foto profil tampil pada bilah navigasi atas (format JPG/PNG, ukuran maks 200 KB).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photoState?.message && (
            <div
              className={`p-3.5 rounded-lg mb-4 text-xs flex items-start gap-2.5 ${
                photoState.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {photoState.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{photoState.message}</span>
            </div>
          )}

          {photoError && (
            <div className="p-3.5 rounded-lg mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{photoError}</span>
            </div>
          )}

          <form action={photoAction} className="space-y-4">
            <input type="hidden" name="photo" value={photoPreview || ""} />

            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Pratinjau Foto"
                  className="h-16 w-16 rounded-full object-cover border border-slate-300"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                  Kosong
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="profile-photo-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Pilih Berkas Foto
                </Button>
                {photoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Hapus Foto
                  </Button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={photoPending || (photoPreview === (user.photo || null))}
            >
              {photoPending ? "Menyimpan Foto…" : "Simpan Foto Profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
