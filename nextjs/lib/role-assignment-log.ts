import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fire-and-forget: upsert +1 to the daily role assignment counter.
 * Never awaited — errors are swallowed to keep the context route fast.
 */
export function logRoleAssignment(role: string): void {
  const supabase = createAdminClient();
  supabase
    .rpc("increment_role_assignment", { p_role: role })
    .then(({ error }) => {
      if (error) console.error("[role-log]", error.message);
    });
}
