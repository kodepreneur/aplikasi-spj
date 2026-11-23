import { getOfficialsAction } from "@/app/actions/officials";
import { OfficialClient } from "./official-client";
import { requireAuth } from "@/lib/auth/session";

export const metadata = {
  title: "Master Data Pejabat - Bapenda Jember",
  description: "Kelola data pejabat penandatangan pengadaan langsung dan SPJ Bapenda Kabupaten Jember",
};

export default async function OfficialPage() {
  await requireAuth();
  const officials = await getOfficialsAction();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OfficialClient initialOfficials={officials} />
    </div>
  );
}
