import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";

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

  return { data: data as Reaction, action: "added" };
}
