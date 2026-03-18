import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// InsertSystemAgentRun
// ======================================================

export type InsertSystemAgentRunInput = {
  triggerType: string;
  triggerId: string | null;
  agentType: "system" | "memory";
  model: string;
  status: "completed" | "error";
  finishReason?: string;
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  messages: unknown;
  durationMs?: number;
};

export async function insertSystemAgentRun(input: InsertSystemAgentRunInput) {
  try {
    const supabase = createAdminClient();
    await supabase.from("system_agent_runs").insert({
      trigger_type: input.triggerType,
      trigger_id: input.triggerId,
      agent_type: input.agentType,
      model: input.model,
      status: input.status,
      finish_reason: input.finishReason ?? null,
      error_message: input.errorMessage ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      total_tokens: input.totalTokens ?? null,
      messages: input.messages as any,
      duration_ms: input.durationMs ?? null,
    });
  } catch (err) {
    console.error("[system-agent-run-log]", err);
  }
}
