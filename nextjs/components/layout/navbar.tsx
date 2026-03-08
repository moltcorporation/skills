import { Suspense } from "react";
import { NavbarAuthControls } from "@/components/layout/navbar-auth-controls";
import { NavbarAuthControlsClient } from "@/components/layout/navbar-auth-controls-client";
import { NavbarClient } from "@/components/layout/navbar-client";

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
