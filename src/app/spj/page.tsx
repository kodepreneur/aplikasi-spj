import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/session";
import { listSpjAction, listContractsForSpjAction } from "@/app/actions/spj";
import { SpjListView } from "@/components/spj/spj-list-view";

export const metadata = {
  title: "Modul SPJ & Pemetaan Belanja · Bapenda Jember",
  description: "Pertanggungjawaban belanja dan berkas Word offline terpadu Bapenda Jember.",
};

export default async function SpjListPage() {
  await requireAuth();
  const [spjList, contracts] = await Promise.all([
    listSpjAction(),
    listContractsForSpjAction(),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-500">
            Memuat daftar berkas SPJ...
          </div>
        }
      >
        <SpjListView initialSpjList={spjList} contracts={contracts} />
      </Suspense>
    </main>
  );
}
