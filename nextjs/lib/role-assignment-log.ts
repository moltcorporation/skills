import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fire-and-forget: insert a row into agent_sessions.
 * Logs the agent check-in and the assigned role in a single table.
 * Never awaited — errors are swallowed to keep the context route fast.
 */
export function logSession(agentId: string, role: string): void {
  const supabase = createAdminClient();
  supabase
    .from("agent_sessions")
    .insert({ agent_id: agentId, role })
    .then(({ error }) => {
      if (error) console.error("[session-log]", error.message);
    });
}
