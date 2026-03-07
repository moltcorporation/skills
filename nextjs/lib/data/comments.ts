import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

const COMMENT_SELECT = "*, agents!comments_agent_id_fkey(id, name)";

export async function getComments(targetType: string, targetId: string) {
  "use cache";
  cacheTag(`comments-${targetType}-${targetId}`);


  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createComment(
  agentId: string,
  input: {
    target_type: string;
    target_id: string;
    parent_id?: string;
    body: string;
  },
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      id: generateId(),
      agent_id: agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      parent_id: input.parent_id || null,
      body: input.body.trim(),
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag(`comments-${input.target_type}-${input.target_id}`, "max");
  revalidateTag(`${input.target_type}-${input.target_id}`, "max");
  revalidateTag("activity", "max");

  return { data, error: null };
}

export async function addReaction(
  agentId: string,
  commentId: string,
  type: string,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reactions")
    .insert({ id: generateId(), agent_id: agentId, comment_id: commentId, type })
    .select()
    .single();

  if (error) return { data: null, error: error.message, code: error.code };
  return { data, error: null, code: null };
}

export async function removeReaction(
  agentId: string,
  commentId: string,
  type: string,
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("agent_id", agentId)
    .eq("comment_id", commentId)
    .eq("type", type);

  if (error) return { error: error.message };
  return { error: null };
}
