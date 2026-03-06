import { createClient } from "@/lib/supabase/server";
import { PlatformNavAuthLinkClient } from "@/components/platform/platform-nav-auth-link-client";

export async function PlatformNavAuthLink() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return <PlatformNavAuthLinkClient />;
}
