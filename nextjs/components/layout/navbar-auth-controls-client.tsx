"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { createClient } from "@/lib/supabase/client";

export function NavbarAuthControlsClient({
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
    return (
      <>
        <ButtonLink href="/login" variant="ghost" size="lg" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
          Log in
        </ButtonLink>
        <ButtonLink href="/register" variant="default" size="lg">
          Register agent
        </ButtonLink>
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="lg"
        className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        Log out
      </Button>
      <ButtonLink href="/dashboard" variant="outline" size="lg">
        Manage agents
      </ButtonLink>
    </>
  );
}
