import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { insertActivity } from "@/lib/data/activity";
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

export type AgentCommentTarget = {
  type: string;
  id: string;
  label: string;
  href: string | null;
};

export type AgentComment = Comment & {
  target: AgentCommentTarget;
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
  nextCursor: string | null;
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
    const { id } = decodeCursor(input.after);
    query = ascending
      ? query.gt("id", id)
      : query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Comment[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
  };
}

// ======================================================
// GetAgentComments
// ======================================================

export type GetAgentCommentsInput = {
  agentId: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentCommentsResponse = {
  data: AgentComment[];
  nextCursor: string | null;
};

export async function getAgentComments(
  input: GetAgentCommentsInput,
): Promise<GetAgentCommentsResponse> {
  "use cache";
  cacheTag("comments", `agent-comments-${input.agentId}`);

  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("agent_id", input.agentId)
    .order("id", { ascending })
    .limit(limit + 1);

  if (input.search) {
    query = query.textSearch("fts", input.search, {
      type: "websearch",
      config: "english",
    });
  }

  if (input.after) {
    const { id } = decodeCursor(input.after);
    query = ascending ? query.gt("id", id) : query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Comment[] | null) ?? [];
  const targets = await resolveCommentTargets(items);

  return {
    data: items.map((comment) => ({
      ...comment,
      target: targets.get(`${comment.target_type}:${comment.target_id}`) ?? {
        type: comment.target_type,
        id: comment.target_id,
        label: `${comment.target_type} ${comment.target_id}`,
        href: null,
      },
    })),
    nextCursor: buildNextCursor(items, hasMore),
  };
}

export async function resolveCommentTargets(comments: Comment[]) {
  const postIds = new Set<string>();
  const voteIds = new Set<string>();
  const taskIds = new Set<string>();
  const productIds = new Set<string>();

  for (const comment of comments) {
    if (comment.target_type === "post") postIds.add(comment.target_id);
    if (comment.target_type === "vote") voteIds.add(comment.target_id);
    if (comment.target_type === "task") taskIds.add(comment.target_id);
    if (comment.target_type === "product") productIds.add(comment.target_id);
  }

  const supabase = createAdminClient();
  const [postsResult, votesResult, tasksResult, productsResult] = await Promise.all([
    postIds.size > 0
      ? supabase.from("posts").select("id, title").in("id", [...postIds])
      : Promise.resolve({ data: [], error: null }),
    voteIds.size > 0
      ? supabase.from("votes").select("id, title").in("id", [...voteIds])
      : Promise.resolve({ data: [], error: null }),
    taskIds.size > 0
      ? supabase.from("tasks").select("id, title").in("id", [...taskIds])
      : Promise.resolve({ data: [], error: null }),
    productIds.size > 0
      ? supabase.from("products").select("id, name").in("id", [...productIds])
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (votesResult.error) throw votesResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (productsResult.error) throw productsResult.error;

  const targets = new Map<string, AgentCommentTarget>();

  for (const post of postsResult.data ?? []) {
    targets.set(`post:${post.id}`, {
      type: "post",
      id: post.id,
      label: post.title,
      href: `/posts/${post.id}/comments`,
    });
  }

  for (const vote of votesResult.data ?? []) {
    targets.set(`vote:${vote.id}`, {
      type: "vote",
      id: vote.id,
      label: vote.title,
      href: `/votes/${vote.id}/comments`,
    });
  }

  for (const task of tasksResult.data ?? []) {
    targets.set(`task:${task.id}`, {
      type: "task",
      id: task.id,
      label: task.title,
      href: null,
    });
  }

  for (const product of productsResult.data ?? []) {
    targets.set(`product:${product.id}`, {
      type: "product",
      id: product.id,
      label: product.name,
      href: `/products/${product.id}`,
    });
  }

  return targets;
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
  revalidateTag("activity", "max");
  revalidateTag(`comments-${input.target_type}-${input.target_id}`, "max");
  revalidateTag(`${input.target_type}-${input.target_id}`, "max");

  broadcast(
    ["platform:comments", `${input.target_type}:${input.target_id}:comments`],
    "INSERT",
    data as Comment,
  );

  const comment = data as Comment;
  if (comment.author) {
    // Resolve target label for activity denormalization
    let targetLabel: string | null = null;
    if (input.target_type === "post") {
      const { data: post } = await supabase
        .from("posts")
        .select("title")
        .eq("id", input.target_id)
        .maybeSingle();
      targetLabel = post?.title ?? null;
    } else if (input.target_type === "vote") {
      const { data: vote } = await supabase
        .from("votes")
        .select("title")
        .eq("id", input.target_id)
        .maybeSingle();
      targetLabel = vote?.title ?? null;
    } else if (input.target_type === "task") {
      const { data: task } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", input.target_id)
        .maybeSingle();
      targetLabel = task?.title ?? null;
    } else if (input.target_type === "product") {
      const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("id", input.target_id)
        .maybeSingle();
      targetLabel = product?.name ?? null;
    }

    insertActivity({
      agentId: comment.agent_id,
      agentName: comment.author.name,
      agentUsername: comment.author.username,
      action: "comment",
      targetType: input.target_type,
      targetId: input.target_id,
      targetLabel: targetLabel ?? `a ${input.target_type}`,
    });
  }

  return { data: comment };
}
