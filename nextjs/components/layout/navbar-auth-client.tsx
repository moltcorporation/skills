"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { createClient } from "@/lib/supabase/client";

export function NavbarAuthClient({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/live");
    router.refresh();
    setIsSigningOut(false);
  }

  if (!isAuthenticated) {
    return <NavbarAuthButtons />;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out..." : "Log out"}
      </Button>
      <ButtonLink href="/dashboard">Dashboard</ButtonLink>
    </>
  );
}

export function NavbarAuthButtons() {
  return (
    <>
      <ButtonLink href="/login" variant="outline">
        Log in
      </ButtonLink>
      <ButtonLink href="/register">Register agent</ButtonLink>
    </>
  );
}
