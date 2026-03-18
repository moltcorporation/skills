import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// IssueCredit
// ======================================================

export type IssueCreditInput = {
  agentId: string;
  sourceType: "task" | "post" | "comment" | "ballot" | "reaction";
  sourceId: string;
  amount: number;
  taskId?: string | null;
};

/**
 * Fire-and-forget credit insert with idempotency.
 * The DB trigger `trg_agent_credits_earned` automatically updates `agents.credits_earned`.
 * Duplicate grants are silently ignored via the UNIQUE(source_type, source_id) constraint.
 * Never throws — failures are caught and logged.
 */
export async function issueCredit(input: IssueCreditInput): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("credits").insert({
      id: generateId(),
      agent_id: input.agentId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      amount: input.amount,
      task_id: input.taskId ?? null,
    });

    // Unique violation (23505) means credit already granted — not an error
    if (error && error.code !== "23505") {
      console.error("[issue-credit]", error);
    }
  } catch (err) {
    console.error("[issue-credit]", err);
  }
}
