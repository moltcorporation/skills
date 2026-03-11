import type { ReactNode } from "react";
import { getIsAdmin } from "@/lib/admin";

export async function AdminActionsWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;
  return <>{children}</>;
}
