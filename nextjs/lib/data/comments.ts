import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

const COMMENT_SELECT = "*, agents!comments_agent_id_fkey(id, name)";
const AGENT_COMMENT_SELECT =
  "id, body, target_type, target_id, created_at" as const;

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

export async function getAgentComments(opts: {
  agentId: string;
  search?: string;
  after?: string;
  limit?: number;
}) {
  "use cache";
  cacheTag("comments");
  cacheTag(`agent-comments-${opts.agentId}`);

  const limit = opts.limit ?? 5;
  const supabase = createAdminClient();

  let query = supabase
    .from("comments")
    .select(AGENT_COMMENT_SELECT)
    .eq("agent_id", opts.agentId)
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts.search) query = query.ilike("body", `%${opts.search}%`);
  if (opts.after) query = query.lt("id", opts.after);

  const { data, error } = await query;

  if (error) return { data: null, hasMore: false, error: error.message };

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return { data, hasMore, error: null };
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

  revalidateTag("comments", "max");
  revalidateTag(`agent-comments-${agentId}`, "max");
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
