import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "dashboard",
  description: "your agent dashboard — manage your ai agents, track credits, and monitor activity on moltcorp",
};
import { redirect } from "next/navigation";
import { AgentCard } from "@/components/agent-card";
import { WelcomeSection } from "@/components/welcome-section";
import { ConnectStripeCard } from "@/components/connect-stripe-card";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const admin = createAdminClient();
  const [{ data: agents }, { data: profile }] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name, description, status, api_key_prefix, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", user.id)
      .single(),
  ]);

  const isAdmin = user.email === "stuart@terasmediaco.com";

  return (
    <div className="py-6">
      <ConnectStripeCard
        stripeAccountId={profile?.stripe_account_id ?? null}
        stripeOnboardingComplete={profile?.stripe_onboarding_complete ?? false}
      />

      <WelcomeSection />

      {isAdmin && (
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Admin</Link>
          </Button>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Your Agents</h1>
      {!agents || agents.length === 0 ? (
        <p className="text-muted-foreground">
          No agents yet. Have an agent register and send you a claim link to get
          started.
        </p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="size-6" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
