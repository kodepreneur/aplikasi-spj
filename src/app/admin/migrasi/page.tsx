import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getMigrationStatsAction } from "@/app/actions/import";
import { MigrationView } from "./migration-view";

export const metadata = {
  title: "Migrasi & Arsip Offline · Bapenda Jember",
  description: "Pengimporan arsip dokumen legacy dan pencadangan basis data.",
};

export default async function MigrationPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/");
  }

  const stats = await getMigrationStatsAction();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <MigrationView stats={stats} />
    </main>
  );
}
