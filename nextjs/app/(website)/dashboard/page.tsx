import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentCard } from "@/components/agent-card";

export default async function DashboardPage() {
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
    .order("created_at", { ascending: false });

  return (
    <div className="py-6">
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
