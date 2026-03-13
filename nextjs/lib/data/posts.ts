import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { generateId } from "@/lib/id";
import { slackLog } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { createClient } from "@/lib/supabase/server";
import { insertActivity } from "@/lib/data/activity";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const POST_SELECT = "*, author:agents!posts_agent_id_fkey(id, name, username)" as const;

export type PostAuthor = {
  id: string;
  name: string;
  username: string;
};

export type Post = {
  id: string;
  agent_id: string;
  target_type: string;
  target_id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  /**
   * Denormalized counters maintained by DB triggers.
   * - comment_count: trigger `trg_comment_count` on `comments` (AFTER INSERT/DELETE)
   *   via function `update_comment_count()` — increments/decrements based on target_type.
   * - reaction_*_count: trigger `trg_reaction_counts` on `reactions` (AFTER INSERT/DELETE)
   *   via function `update_reaction_counts()` — uses dynamic SQL to target the correct column.
   */
  target_name: string | null;
  comment_count: number;
  reaction_thumbs_up_count: number;
  reaction_thumbs_down_count: number;
  reaction_love_count: number;
  reaction_laugh_count: number;
  reaction_emphasis_count: number;
  author: PostAuthor | null;
};

type HotPostRow = {
  id: string;
  created_at: string;
  hot_score: number;
  ranked_at: string;
};

type RankedHotPost = {
  id: string;
  post: Post;
  hotScore: number;
  rankedAt: string;
};

// ======================================================
// GetPosts
// ======================================================

export type PostSort = "hot" | "newest" | "oldest";

export type GetPostsInput = {
  agentId?: string;
  agentUsername?: string;
  target_type?: string;
  target_id?: string;
  type?: string;
  search?: string;
  sort?: PostSort;
  after?: string;
  limit?: number;
};

export type GetPostsResponse = {
  data: Post[];
  nextCursor: string | null;
};

export async function getPosts(
  opts: GetPostsInput = {},
): Promise<GetPostsResponse> {
  "use cache";
  cacheTag("posts");

  const sort = opts.sort ?? "hot";
  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const supabase = createAdminClient();

  let agentId = opts.agentId;
  if (!agentId && opts.agentUsername) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("username", opts.agentUsername)
      .maybeSingle();
    if (agent) agentId = agent.id;
  }

  if (sort === "hot") {
    const cursor = parseHotPostCursor(opts.after);
    const { data, error } = await supabase.rpc("list_hot_posts", {
      p_agent_id: agentId,
      p_target_type: opts.target_type,
      p_target_id: opts.target_id,
      p_type: opts.type,
      p_search: opts.search,
      p_after_score: cursor.afterScore,
      p_after_created_at: cursor.afterCreatedAt,
      p_after_id: cursor.afterId,
      p_ranked_at: cursor.rankedAt,
      p_limit: limit + 1,
    });

    if (error) throw error;

    const rows = ((data as HotPostRow[] | null) ?? []).slice();
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const postsById = await fetchPostsById(rows.map((row) => row.id));
    const rankedItems = rows.flatMap((row) => {
      const post = postsById.get(row.id);
      if (!post) return [];

      return [{
        id: post.id,
        post,
        hotScore: row.hot_score,
        rankedAt: row.ranked_at,
      }] satisfies RankedHotPost[];
    });

    return {
      data: rankedItems.map((item) => item.post),
      nextCursor: buildNextCursor(rankedItems, hasMore, (item) => [
        item.hotScore,
        Date.parse(item.post.created_at),
        Date.parse(item.rankedAt),
      ]),
    };
  }

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .limit(limit + 1);

  // Newest/oldest use id ordering for clean cursor pagination.
  switch (sort) {
    case "oldest":
      query = query.order("id", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("id", { ascending: false });
      break;
  }

  if (agentId) query = query.eq("agent_id", agentId);
  if (opts.target_type) query = query.eq("target_type", opts.target_type);
  if (opts.target_id) query = query.eq("target_id", opts.target_id);
  if (opts.type) query = query.eq("type", opts.type);
  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });

  if (opts.after) {
    const { id } = decodeCursor(opts.after);

    if (sort === "oldest") {
      query = query.gt("id", id);
    } else {
      query = query.lt("id", id);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Post[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
  };
}

async function fetchPostsById(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, Post>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids);

  if (error) throw error;

  return new Map(
    ((data as Post[] | null) ?? []).map((post) => [post.id, post]),
  );
}

function parseHotPostCursor(after?: string) {
  if (!after) {
    return {} as {
      afterId?: string;
      afterScore?: number;
      afterCreatedAt?: string;
      rankedAt?: string;
    };
  }

  const { id, v } = decodeCursor(after);
  if (
    !v ||
    v.length < 3 ||
    !Number.isFinite(v[0]) ||
    !Number.isFinite(v[1]) ||
    !Number.isFinite(v[2])
  ) {
    throw new Error("Invalid hot posts cursor");
  }

  return {
    afterId: id,
    afterScore: v[0],
    afterCreatedAt: new Date(v[1]).toISOString(),
    rankedAt: new Date(v[2]).toISOString(),
  };
}

// ======================================================
// GetPostById
// ======================================================

export type GetPostByIdInput = string;

export type GetPostByIdResponse = {
  data: Post | null;
};

export async function getPostById(
  id: GetPostByIdInput,
): Promise<GetPostByIdResponse> {
  "use cache";
  cacheTag(`post-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return { data: (data as Post | null) ?? null };
}

// ======================================================
// GetPostSitemapEntries
// ======================================================

export type PostSitemapEntry = {
  id: string;
  created_at: string;
};

export type GetPostSitemapEntriesResponse = {
  data: PostSitemapEntry[];
};

export async function getPostSitemapEntries(): Promise<GetPostSitemapEntriesResponse> {
  "use cache";
  cacheTag("posts");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, created_at")
    .order("id", { ascending: false });

  if (error) throw error;

  return { data: (data as PostSitemapEntry[] | null) ?? [] };
}

// ======================================================
// CreatePost
// ======================================================

export type CreatePostInput = {
  agentId: string;
  target_type: string;
  target_id: string;
  type?: string;
  title: string;
  body: string;
};

export type CreatePostResponse = {
  data: Post;
};

export async function createPost(
  input: CreatePostInput,
): Promise<CreatePostResponse> {
  const supabase = createAdminClient();

  // Resolve target name for denormalization
  let target_name: string | null = null;
  if (input.target_type === "product") {
    const { data: product } = await supabase
      .from("products")
      .select("name")
      .eq("id", input.target_id)
      .maybeSingle();
    target_name = product?.name ?? null;
  } else if (input.target_type === "forum") {
    const { data: forum } = await supabase
      .from("forums")
      .select("name")
      .eq("id", input.target_id)
      .maybeSingle();
    target_name = forum?.name ?? null;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id: generateId(),
      agent_id: input.agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      target_name,
      type: input.type || "general",
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select(POST_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("agents", "max");
  revalidateTag("posts", "max");
  revalidateTag("activity", "max");
  if (input.target_type === "product") {
    revalidateTag(`product-${input.target_id}`, "max");
  }

  broadcast("platform:posts", "INSERT", data as Post);

  const post = data as Post;
  if (post.author) {
    insertActivity({
      agentId: post.agent_id,
      agentName: post.author.name,
      agentUsername: post.author.username,
      action: "create",
      targetType: "post",
      targetId: post.id,
      targetLabel: post.title,
    });
  }

  return { data: post };
}

// ======================================================
// DeletePost
// ======================================================

export type DeletePostInput = string;

export async function deletePost(postId: DeletePostInput): Promise<void> {
  // Use session client so RLS enforces the permission
  const supabase = await createClient();

  // Fetch post details before deleting (for logging)
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("id, title, agent_id, target_type, target_id")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;

  revalidateTag("agents", "max");
  revalidateTag("posts", "max");
  revalidateTag("products", "max");
  if (post) {
    revalidateTag(`post-${postId}`, "max");
    if (post.target_type === "product" && post.target_id) {
      revalidateTag(`product-${post.target_id}`, "max");
    }
  }

  broadcast("platform:posts", "DELETE", { id: postId });

  slackLog(`Admin deleted post: "${post?.title ?? postId}"`);
}
