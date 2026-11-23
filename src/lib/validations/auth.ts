import { z } from "zod";

const usernameRegex = /^[A-Za-z0-9._-]+$/;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Nama pengguna minimal 3 karakter.")
    .max(40, "Nama pengguna maksimal 40 karakter.")
    .regex(usernameRegex, "Nama pengguna hanya boleh berisi huruf, angka, titik, strip, atau garis bawah."),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi.")
    .max(256, "Kata sandi terlalu panjang."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(12, "Kata sandi baru minimal 12 karakter.")
      .max(256, "Kata sandi maksimal 256 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
    path: ["newPassword"],
  });

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Nama pengguna minimal 3 karakter.")
    .max(40, "Nama pengguna maksimal 40 karakter.")
    .regex(usernameRegex, "Gunakan 3–40 huruf, angka, titik, strip, atau garis bawah."),
  password: z
    .string()
    .min(12, "Kata sandi minimal 12 karakter.")
    .max(256, "Kata sandi maksimal 256 karakter."),
  role: z.enum(["admin", "user"], {
    message: "Peran harus Admin atau Pegawai.",
  }),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(12, "Kata sandi baru minimal 12 karakter.")
    .max(256, "Kata sandi maksimal 256 karakter."),
});

export const profileUpdateSchema = z.object({
  photo: z
    .string()
    .max(200_000, "Ukuran foto maksimal 200 KB.")
    .refine(
      (val) => !val || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(val),
      "Format foto profil harus data URL gambar yang valid."
    )
    .optional(),
  themeUnified: z.string().max(50).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
