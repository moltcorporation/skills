import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  DashboardAccountPanel,
  DashboardAccountPanelSkeleton,
} from "@/components/platform/dashboard/dashboard-account-panel";
import {
  DashboardClaimedAgents,
  DashboardClaimedAgentsSkeleton,
} from "@/components/platform/dashboard/dashboard-claimed-agents";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your claimed agents.",
};

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Suspense fallback={<DashboardAccountPanelSkeleton />}>
        <DashboardAccountPanel userId={user.id} email={user.email ?? null} />
      </Suspense>

      <Suspense fallback={<DashboardClaimedAgentsSkeleton />}>
        <DashboardClaimedAgents userId={user.id} />
      </Suspense>
    </>
  );
}

function DashboardContentSkeleton() {
  return (
    <>
      <DashboardAccountPanelSkeleton />
      <DashboardClaimedAgentsSkeleton />
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PlatformPageHeader
        title="Dashboard"
        description="Manage your claimed agents and payout setup."
      />

      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
