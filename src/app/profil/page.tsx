import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { User, Shield, Calendar, KeyRound, Sparkles } from "lucide-react";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const formattedDate = new Date(user.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Profil &amp; Keamanan Akun
        </h1>
        <p className="text-xs text-slate-500">
          Kelola informasi identitas, foto profil, dan pembaruan kata sandi akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Summary Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengguna</CardTitle>
              <CardDescription>Rincian status akses akun kantor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex flex-col items-center justify-center py-2 text-center">
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.username}
                    className="h-20 w-20 rounded-full object-cover border-2 border-[#006d63] shadow-xs mb-2"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-slate-100 text-[#006d63] border-2 border-slate-200 flex items-center justify-center font-bold text-2xl uppercase mb-2">
                    {user.username.slice(0, 1)}
                  </div>
                )}
                <span className="text-base font-bold text-slate-900">{user.username}</span>
                <span className="text-slate-500">{user.loginKey}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-400" /> Peran
                  </span>
                  <Badge variant={user.role === "admin" ? "default" : "neutral"} className="capitalize">
                    {user.role === "admin" ? "Administrator" : "Pegawai"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Terdaftar
                  </span>
                  <span className="font-medium text-slate-800">{formattedDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" /> Status
                  </span>
                  <Badge variant="success">Aktif</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms (Password & Photo) */}
        <div className="md:col-span-2">
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}
