import { createClient } from "@/lib/supabase/server";
import { PlatformSidebarAccountSection } from "@/components/platform/platform-sidebar-account-section";

export async function PlatformSidebarAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return <PlatformSidebarAccountSection />;
}
