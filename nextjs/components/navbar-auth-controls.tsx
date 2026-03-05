import { createClient } from "@/lib/supabase/server";
import { NavbarAuthControlsClient } from "@/components/navbar-auth-controls-client";

export async function NavbarAuthControls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <NavbarAuthControlsClient isAuthenticated={Boolean(user)} />;
}
