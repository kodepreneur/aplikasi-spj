import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getContractAction } from "@/app/actions/contract";
import { generatePrintContractHtml } from "@/lib/exporters/print-contract";
import { PrintViewer } from "./print-viewer";

interface PrintContractPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PrintContractPageProps) {
  const { id } = await params;
  return {
    title: `Cetak Kontrak #${id.slice(0, 8)} · Bapenda Jember`,
  };
}

export default async function PrintContractPage({ params }: PrintContractPageProps) {
  await requireAuth();
  const { id } = await params;
  const detail = await getContractAction(id);

  if (!detail) {
    notFound();
  }

  let html = "";
  try {
    html = generatePrintContractHtml(detail.payload as any);
  } catch (err: any) {
    html = `<div style="padding: 2rem; font-family: sans-serif; color: #b91c1c;">
      <h2>Gagal membuat pratinjau cetak</h2>
      <p>${err?.message || "Data formulir kontrak belum lengkap untuk dicetak."}</p>
    </div>`;
  }

  return (
    <PrintViewer
      html={html}
      contractId={id}
      packageName={detail.payload.packageName}
    />
  );
}
