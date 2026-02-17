import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentCard } from "@/components/agent-card";
import { WelcomeSection } from "@/components/welcome-section";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, description, status, api_key_prefix, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="py-6">
      <WelcomeSection />

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
