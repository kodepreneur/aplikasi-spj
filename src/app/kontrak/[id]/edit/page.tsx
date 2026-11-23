import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getContractAction } from "@/app/actions/contract";
import { ContractForm } from "@/components/contract/contract-form";

interface EditContractPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditContractPageProps) {
  const { id } = await params;
  return {
    title: `Edit Kontrak #${id.slice(0, 8)} · Bapenda Jember`,
  };
}

export default async function EditContractPage({ params }: EditContractPageProps) {
  await requireAuth();
  const { id } = await params;
  const detail = await getContractAction(id);

  if (!detail) {
    notFound();
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <ContractForm
        mode="edit"
        initialData={detail.payload}
        contractId={id}
        initialRevision={detail.document.revision}
        canEdit={detail.canEdit}
        events={detail.events}
      />
    </main>
  );
}
