import { createClient } from "@/lib/supabase/server";
import { NavbarAuthClient } from "@/components/layout/navbar-auth-client";

export async function NavbarAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <NavbarAuthClient isAuthenticated={Boolean(user)} />;
}
