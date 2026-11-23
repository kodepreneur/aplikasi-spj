import { and, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getSpjTemplate, getDefaultSpjValues } from "@/lib/domain/spj-template";
import { mapContractToSpj, type SpjSourceSnapshot } from "@/lib/domain/link-mapper";
import { SpjForm } from "@/components/spj/spj-form";
import type { SpjItemInput } from "@/lib/domain/tax-calc";

export const metadata = {
  title: "Buat SPJ Belanja Baru · Bapenda Jember",
  description: "Formulir pembuatan pertanggungjawaban belanja Bapenda Jember.",
};

interface NewSpjPageProps {
  searchParams: Promise<{ fromContract?: string }>;
}

export default async function NewSpjPage({ searchParams }: NewSpjPageProps) {
  await requireAuth();
  const { fromContract } = await searchParams;

  const template = getSpjTemplate();
  const defaultValues = getDefaultSpjValues();

  let initialValues: Record<string, any> = { ...defaultValues };
  let initialItems: SpjItemInput[] = [
    {
      description: "",
      detail: "",
      unit: "Paket",
      quantity: "1",
      unitPrice: "0",
    },
  ];
  let linkSnapshot: SpjSourceSnapshot | null = null;
  let sourceStatus: "none" | "current" = "none";

  if (fromContract) {
    const db = getDb();
    const contractDoc = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.app, "kontrak"),
          eq(documents.id, fromContract),
          sql`${documents.deletedAt} IS NULL`
        )
      )
      .get();

    if (contractDoc) {
      try {
        const contractPayload = JSON.parse(contractDoc.payload);
        const mapped = mapContractToSpj(contractDoc, contractPayload);

        initialValues = {
          ...defaultValues,
          ...mapped.values,
        };
        initialItems = mapped.items;
        linkSnapshot = mapped.source;
        sourceStatus = "current";
      } catch (err) {
        console.error("Gagal memetakan kontrak ke SPJ:", err);
      }
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <SpjForm
        mode="create"
        initialValues={initialValues}
        initialItems={initialItems}
        linkSnapshot={linkSnapshot}
        sourceStatus={sourceStatus}
        templateFields={template.fields}
      />
    </main>
  );
}
