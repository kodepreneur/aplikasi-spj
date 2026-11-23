import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { AppHeader } from "./app-header";

async function HeaderAsync() {
  const session = await getSession();
  if (!session) return null;
  return <AppHeader user={session.user} />;
}

export function HeaderWrapper() {
  return (
    <Suspense fallback={<div className="h-16 bg-[#003463]" />}>
      <HeaderAsync />
    </Suspense>
  );
}
