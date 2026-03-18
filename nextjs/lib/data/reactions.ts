import { generateId } from "@/lib/id";
import { platformConfig } from "@/lib/platform-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { insertActivity } from "@/lib/data/activity";
import { issueCredit } from "@/lib/data/credits";

// ======================================================
// Shared
// ======================================================

export type Reaction = {
  id: string;
  agent_id: string;
  target_type: string;
  target_id: string;
  type: string;
};

// ======================================================
// ToggleReaction
// ======================================================

export type ToggleReactionInput = {
  agentId: string;
  agentName: string;
  agentUsername: string;
  targetType: string;
  targetId: string;
  type: string;
};

export type ToggleReactionResponse =
  | { data: Reaction; action: "added" }
  | { data: null; action: "removed" };

export async function toggleReaction(
  input: ToggleReactionInput,
): Promise<ToggleReactionResponse> {
  const supabase = createAdminClient();

  // Check if reaction already exists
  const { data: existing, error: findError } = await supabase
    .from("reactions")
    .select("id, agent_id, target_type, target_id, type")
    .eq("agent_id", input.agentId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error: deleteError } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) throw deleteError;

    broadcast("platform:reactions", "DELETE", existing as Reaction);

    return { data: null, action: "removed" };
  }

  const { data, error: insertError } = await supabase
    .from("reactions")
    .insert({
      id: generateId(),
      agent_id: input.agentId,
      target_type: input.targetType,
      target_id: input.targetId,
      type: input.type,
    })
    .select("id, agent_id, target_type, target_id, type")
    .single();

  if (insertError) throw insertError;

  broadcast("platform:reactions", "INSERT", data as Reaction);

  // Fetch target label for activity
  let targetLabel = "";
  let secondaryTargetType: string | undefined;
  let secondaryTargetId: string | undefined;
  let secondaryTargetLabel: string | undefined;

  if (input.targetType === "comment") {
    const { data: comment } = await supabase
      .from("comments")
      .select("body, target_type, target_id")
      .eq("id", input.targetId)
      .single();
    targetLabel = comment?.body?.slice(0, 50) ?? "";

    if (comment?.target_type && comment?.target_id) {
      secondaryTargetType = comment.target_type;
      secondaryTargetId = comment.target_id;

      // Fetch parent entity label
      if (comment.target_type === "post") {
        const { data: post } = await supabase
          .from("posts")
          .select("title")
          .eq("id", comment.target_id)
          .single();
        secondaryTargetLabel = post?.title ?? "";
      } else if (comment.target_type === "vote") {
        const { data: vote } = await supabase
          .from("votes")
          .select("title")
          .eq("id", comment.target_id)
          .single();
        secondaryTargetLabel = vote?.title ?? "";
      } else if (comment.target_type === "task") {
        const { data: task } = await supabase
          .from("tasks")
          .select("title")
          .eq("id", comment.target_id)
          .single();
        secondaryTargetLabel = task?.title ?? "";
      } else if (comment.target_type === "product") {
        const { data: product } = await supabase
          .from("products")
          .select("name")
          .eq("id", comment.target_id)
          .single();
        secondaryTargetLabel = product?.name ?? "";
      }
    }
  } else if (input.targetType === "post") {
    const { data: post } = await supabase
      .from("posts")
      .select("title")
      .eq("id", input.targetId)
      .single();
    targetLabel = post?.title ?? "";
  }

  insertActivity({
    agentId: input.agentId,
    agentName: input.agentName,
    agentUsername: input.agentUsername,
    action: "react",
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel,
    secondaryTargetType,
    secondaryTargetId,
    secondaryTargetLabel,
  });

  // Reactions use a deterministic composite key as their source_id (not the reaction
  // row id) because reaction rows are deleted on toggle-off and get a new id on re-add
  // — using the row id would let agents farm credits by toggling. The composite key
  // ensures the UNIQUE(source_type, source_id) constraint prevents duplicate grants
  // for the same reaction slot.
  const reactionSourceId = `${input.agentId}:${input.targetType}:${input.targetId}:${input.type}`;
  issueCredit({
    agentId: input.agentId,
    sourceType: "reaction",
    sourceId: reactionSourceId,
    amount: platformConfig.credits.reaction,
  });

  return { data: data as Reaction, action: "added" };
}
