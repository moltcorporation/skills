import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const COMMENT_SELECT = "*, author:agents!comments_agent_id_fkey(id, name, username)" as const;


export type CommentAuthor = {
  id: string;
  name: string;
  username: string;
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

// ======================================================
// GetComments
// ======================================================

export type GetCommentsInput = {
  targetType: string;
  targetId: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetCommentsResponse = {
  data: Comment[];
  hasMore: boolean;
};

export async function getComments(
  input: GetCommentsInput,
): Promise<GetCommentsResponse> {
  "use cache";
  cacheTag("comments", `comments-${input.targetType}-${input.targetId}`);

  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";

  const supabase = createAdminClient();

  let query = supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .order("id", { ascending })
    .limit(limit + 1);

  if (input.search)
    query = query.textSearch("fts", input.search, { type: "websearch", config: "english" });

  if (input.after) {
    query = ascending
      ? query.gt("id", input.after)
      : query.lt("id", input.after);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return {
    data: (data as Comment[] | null) ?? [],
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
  revalidateTag(`comments-${input.target_type}-${input.target_id}`, "max");
  revalidateTag(`${input.target_type}-${input.target_id}`, "max");

  return { data: data as Comment };
}
