import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getUsersAction } from "@/app/actions/users";
import { UserManagement } from "./user-management";

export default async function AdminAccountsPage() {
  try {
    await requireAdmin();
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") redirect("/login");
    redirect("/");
  }

  const users = await getUsersAction();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kelola Akun Pegawai
          </h1>
          <p className="text-xs text-slate-500">
            Daftar akun pengguna yang memiliki izin akses ke modul Kontrak Manual dan SPJ Bapenda.
          </p>
        </div>
      </div>

      <UserManagement initialUsers={users} />
    </div>
  );
}
