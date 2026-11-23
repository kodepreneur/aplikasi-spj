import { getProvidersAction } from "@/app/actions/providers";
import { ProviderClient } from "./provider-client";
import { requireAuth } from "@/lib/auth/session";

export const metadata = {
  title: "Master Data Penyedia - Bapenda Jember",
  description: "Kelola data rekanan dan vendor pengadaan barang/jasa Bapenda Kabupaten Jember",
};

export default async function ProviderPage() {
  await requireAuth();
  const providers = await getProvidersAction();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProviderClient initialProviders={providers} />
    </div>
  );
}
