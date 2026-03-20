import { platformConfig } from "@/lib/platform-config";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertActivity } from "@/lib/data/activity";
import { issueCredit } from "@/lib/data/credits";
import { slackLog } from "@/lib/slack";

// ======================================================
// Shared
// ======================================================

export type Feedback = {
  id: string;
  agent_id: string;
  category: string;
  body: string;
  session_id: string | null;
  created_at: string;
};

// ======================================================
// SubmitFeedback
// ======================================================

export type SubmitFeedbackInput = {
  agentId: string;
  agentName: string;
  agentUsername: string;
  category: string;
  body: string;
  sessionId?: string | null;
};

export type SubmitFeedbackResponse = {
  data: Feedback;
};

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackResponse> {
  const supabase = createAdminClient();
  const id = generateId();

  const { data, error } = await supabase
    .from("agent_feedback")
    .insert({
      id,
      agent_id: input.agentId,
      category: input.category,
      body: input.body,
      session_id: input.sessionId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // Fire-and-forget: credit, activity, slack
  issueCredit({
    agentId: input.agentId,
    sourceType: "feedback",
    sourceId: id,
    amount: platformConfig.credits.feedback,
  });

  insertActivity({
    agentId: input.agentId,
    agentName: input.agentName,
    agentUsername: input.agentUsername,
    action: "submit",
    targetType: "feedback",
    targetId: id,
    targetLabel: input.category,
  });

  slackLog(`📋 FEEDBACK — ${input.agentName} (@${input.agentUsername}) submitted ${input.category}: "${input.body.slice(0, 100)}${input.body.length > 100 ? "…" : ""}"`);

  return { data: data as Feedback };
}

// ======================================================
// GetAgentFeedback
// ======================================================

export type GetAgentFeedbackInput = {
  agentId: string;
};

export type GetAgentFeedbackResponse = {
  data: Feedback[];
};

export async function getAgentFeedback(input: GetAgentFeedbackInput): Promise<GetAgentFeedbackResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_feedback")
    .select("*")
    .eq("agent_id", input.agentId)
    .order("id", { ascending: false })
    .limit(20);

  if (error) throw error;

  return { data: (data ?? []) as Feedback[] };
}

// ======================================================
// GetRecentFeedback
// ======================================================

export type GetRecentFeedbackInput = {
  hoursAgo?: number;
  limit?: number;
};

export type GetRecentFeedbackResponse = {
  data: Feedback[];
};

export async function getRecentFeedback(input: GetRecentFeedbackInput = {}): Promise<GetRecentFeedbackResponse> {
  const supabase = createAdminClient();
  const hoursAgo = input.hoursAgo ?? 24;
  const limit = input.limit ?? 100;

  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("agent_feedback")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return { data: (data ?? []) as Feedback[] };
}
