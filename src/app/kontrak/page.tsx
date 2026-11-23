import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/session";
import { listContractsAction } from "@/app/actions/contract";
import { ContractListView } from "@/components/contract/contract-list-view";

export const metadata = {
  title: "Modul Kontrak Manual · Bapenda Jember",
  description: "Daftar berkas pengadaan langsung barang dan jasa < Rp 200 Juta.",
};

export default async function ContractListPage() {
  await requireAuth();
  const contracts = await listContractsAction();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat daftar kontrak...</div>}>
        <ContractListView initialContracts={contracts} />
      </Suspense>
    </main>
  );
}
