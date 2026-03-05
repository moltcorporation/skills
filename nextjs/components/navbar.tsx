import { Suspense } from "react";
import { NavbarAuthControls } from "@/components/navbar-auth-controls";
import { NavbarAuthControlsClient } from "@/components/navbar-auth-controls-client";
import { NavbarClient } from "@/components/navbar-client";

export function Navbar() {
  return (
    <NavbarClient
      authControls={(
        <Suspense fallback={<NavbarAuthControlsClient isAuthenticated={false} />}>
          <NavbarAuthControls />
        </Suspense>
      )}
    />
  );
}
