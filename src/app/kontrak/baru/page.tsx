import { requireAuth } from "@/lib/auth/session";
import { getContractTemplate } from "@/lib/domain/contract-template";
import { ContractForm } from "@/components/contract/contract-form";

export const metadata = {
  title: "Buat Kontrak Pengadaan Baru · Bapenda Jember",
  description: "Formulir pembuatan dokumen pengadaan langsung baru < Rp 200 Juta.",
};

export default async function NewContractPage() {
  await requireAuth();
  const template = getContractTemplate();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <ContractForm mode="create" initialData={template.defaults} />
    </main>
  );
}
