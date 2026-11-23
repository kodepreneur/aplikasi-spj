"use client";

import { useState, useTransition } from "react";
import { 
  createUserAction, 
  toggleUserActiveAction, 
  resetUserPasswordAction, 
  deleteUserAction,
  type UserView 
} from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Search, 
  KeyRound, 
  ShieldCheck, 
  PowerOff, 
  Power, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  X
} from "lucide-react";

interface UserManagementProps {
  initialUsers: UserView[];
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<UserView[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<UserView | null>(null);

  // Filter users by search term
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createUserAction(null, formData);
      if (res.success && res.user) {
        setUsers((prev) => [...prev, res.user!]);
        setShowAddModal(false);
        setFeedback({ type: "success", text: res.message });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  // Handle Toggle Active
  const handleToggleActive = (user: UserView) => {
    const targetState = !user.active;
    const actionText = targetState ? "mengaktifkan" : "menonaktifkan";

    if (!window.confirm(`Yakin ingin ${actionText} akun ${user.username}?`)) return;

    startTransition(async () => {
      const res = await toggleUserActiveAction(user.id, targetState);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, active: targetState } : u))
        );
        setFeedback({ type: "success", text: res.message });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showResetModal) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await resetUserPasswordAction(showResetModal.id, formData);
      if (res.success) {
        setShowResetModal(null);
        setFeedback({ type: "success", text: res.message });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  // Handle Delete User
  const handleDeleteUser = (user: UserView) => {
    if (!window.confirm(`Hapus akun '${user.username}'? Akun akan dinonaktifkan permanen dan riwayat pekerjaannya tetap disimpan untuk audit.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setFeedback({ type: "success", text: res.message });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Control bar: Search & Add button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pengguna…"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#006d63] focus:ring-1 focus:ring-[#006d63]"
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="self-end sm:self-auto"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Tidak ada akun pengguna yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-100 text-[#006d63] font-bold flex items-center justify-center uppercase text-[11px]">
                          {user.username.slice(0, 1)}
                        </div>
                        <span className="font-semibold text-slate-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === "admin" ? "default" : "neutral"} className="capitalize">
                        {user.role === "admin" ? "Administrator" : "Pegawai"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {user.active ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="danger">Nonaktif</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowResetModal(user)}
                          title="Reset Kata Sandi"
                          className="h-8 px-2 text-slate-600 hover:text-slate-900"
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1" />
                          <span>Reset</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          title={user.active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                          className={`h-8 px-2 ${
                            user.active
                              ? "text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                              : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          }`}
                        >
                          {user.active ? (
                            <>
                              <PowerOff className="h-3.5 w-3.5 mr-1" />
                              <span>Nonaktifkan</span>
                            </>
                          ) : (
                            <>
                              <Power className="h-3.5 w-3.5 mr-1" />
                              <span>Aktifkan</span>
                            </>
                          )}
                        </Button>

                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Hapus Akun"
                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            <span>Hapus</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Tambah Pengguna */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <Input
                name="username"
                label="Nama Pengguna"
                placeholder="Contoh: ahmad"
                required
                hint="3–40 karakter huruf, angka, titik, atau strip"
              />

              <Input
                name="password"
                type="password"
                label="Kata Sandi Awal"
                placeholder="Minimal 12 karakter"
                required
                hint="Minimal 12 karakter"
              />

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-slate-700">Peran Akun</label>
                <select
                  name="role"
                  defaultValue="user"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#006d63] focus:ring-1 focus:ring-[#006d63]"
                >
                  <option value="user">Pegawai (Akses dokumen mandiri)</option>
                  <option value="admin">Administrator (Akses kelola seluruh dokumen &amp; akun)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                >
                  {isPending ? "Menyimpan…" : "Simpan Pengguna"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reset Kata Sandi */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reset Kata Sandi</h3>
                <p className="text-[11px] text-slate-500">
                  Untuk pengguna: <b>{showResetModal.username}</b>
                </p>
              </div>
              <button
                onClick={() => setShowResetModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <Input
                name="password"
                type="password"
                label="Kata Sandi Baru"
                placeholder="Minimal 12 karakter"
                required
                hint="Sandi baru minimal 12 karakter. Sesi aktif pengguna ini akan otomatis ditutup."
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetModal(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                >
                  {isPending ? "Menyimpan…" : "Reset Kata Sandi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
