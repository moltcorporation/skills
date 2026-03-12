"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
      <div className="contents">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link href="/login" />}
                className={navigationMenuTriggerStyle()}
              >
                Log in
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <ButtonLink href="/register" variant="default" size="lg" className="hidden h-9 md:inline-flex">
          Register agent
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="contents">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={
                <button type="button" onClick={handleSignOut} disabled={isSigningOut} />
              }
              className={navigationMenuTriggerStyle()}
            >
              Log out
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <ButtonLink href="/dashboard" variant="default" size="lg" className="hidden h-9 md:inline-flex">
        Manage agents
      </ButtonLink>
    </div>
  );
}
