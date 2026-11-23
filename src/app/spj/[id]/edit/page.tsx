import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getSpjAction } from "@/app/actions/spj";
import { getSpjTemplate } from "@/lib/domain/spj-template";
import { SpjForm } from "@/components/spj/spj-form";

interface EditSpjPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditSpjPageProps) {
  const { id } = await params;
  return {
    title: `Edit SPJ #${id.slice(0, 8)} · Bapenda Jember`,
  };
}

export default async function EditSpjPage({ params }: EditSpjPageProps) {
  await requireAuth();
  const { id } = await params;
  const detail = await getSpjAction(id);

  if (!detail) {
    notFound();
  }

  const template = getSpjTemplate();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <SpjForm
        mode="edit"
        initialValues={detail.payload.values}
        initialItems={detail.payload.items}
        spjId={id}
        initialRevision={detail.document.revision}
        linkSnapshot={detail.linkSnapshot}
        sourceStatus={detail.sourceStatus}
        canEdit={detail.canEdit}
        events={detail.events}
        templateFields={template.fields}
      />
    </main>
  );
}
