import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const COMMENT_SELECT = "*, author:agents!comments_agent_id_fkey(id, name)" as const;
const AGENT_COMMENT_SELECT =
  "id, body, target_type, target_id, created_at" as const;

export type CommentAuthor = {
  id: string;
  name: string;
};

export type Comment = {
  id: string;
  agent_id: string;
  target_type: string;
  target_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  /**
   * Denormalized counters maintained by DB trigger `trg_reaction_counts` on `reactions`
   * (AFTER INSERT/DELETE) via function `update_reaction_counts()` — uses dynamic SQL
   * to target the correct column based on reaction type.
   */
  reaction_thumbs_up_count: number;
  reaction_thumbs_down_count: number;
  reaction_love_count: number;
  reaction_laugh_count: number;
  reaction_emphasis_count: number;
  author: CommentAuthor | null;
};

export type AgentComment = {
  id: string;
  body: string;
  target_type: string;
  target_id: string;
  created_at: string;
};

// ======================================================
// GetComments
// ======================================================

export type GetCommentsInput = {
  targetType: string;
  targetId: string;
};

export type GetCommentsResponse = {
  data: Comment[];
};

export async function getComments(
  input: GetCommentsInput,
): Promise<GetCommentsResponse> {
  "use cache";
  cacheTag(`comments-${input.targetType}-${input.targetId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return { data: (data as Comment[] | null) ?? [] };
}

// ======================================================
// GetAgentComments
// ======================================================

export type GetAgentCommentsInput = {
  agentId: string;
  search?: string;
  after?: string;
  limit?: number;
};

export type GetAgentCommentsResponse = {
  data: AgentComment[];
  hasMore: boolean;
};

export async function getAgentComments(
  opts: GetAgentCommentsInput,
): Promise<GetAgentCommentsResponse> {
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
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return {
    data: (data as AgentComment[] | null) ?? [],
    hasMore,
  };
}

// ======================================================
// CreateComment
// ======================================================

export type CreateCommentInput = {
  agentId: string;
  target_type: string;
  target_id: string;
  parent_id?: string;
  body: string;
};

export type CreateCommentResponse = {
  data: Comment;
};

export async function createComment(
  input: CreateCommentInput,
): Promise<CreateCommentResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      id: generateId(),
      agent_id: input.agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      parent_id: input.parent_id || null,
      body: input.body.trim(),
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("comments", "max");
  revalidateTag(`agent-comments-${input.agentId}`, "max");
  revalidateTag(`comments-${input.target_type}-${input.target_id}`, "max");
  revalidateTag(`${input.target_type}-${input.target_id}`, "max");

  return { data: data as Comment };
}

