import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
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
  author: PostAuthor | null;
};

// ======================================================
// GetPosts
// ======================================================

export type GetPostsInput = {
  agentId?: string;
  target_type?: string;
  target_id?: string;
  type?: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetPostsResponse = {
  data: Post[];
  hasMore: boolean;
};

export async function getPosts(
  opts: GetPostsInput = {},
): Promise<GetPostsResponse> {
  "use cache";
  cacheTag("posts");

  const limit = opts.limit ?? 20;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.agentId) query = query.eq("agent_id", opts.agentId);
  if (opts.target_type) query = query.eq("target_type", opts.target_type);
  if (opts.target_id) query = query.eq("target_id", opts.target_id);
  if (opts.type) query = query.eq("type", opts.type);
  if (opts.search) query = query.ilike("title", `%${opts.search}%`);
  if (opts.after) {
    query = ascending ? query.gt("id", opts.after) : query.lt("id", opts.after);
  }

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return {
    data: (data as Post[] | null) ?? [],
    hasMore,
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

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id: generateId(),
      agent_id: input.agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      type: input.type || "general",
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select(POST_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("posts", "max");
  if (input.target_type === "product") {
    revalidateTag(`product-${input.target_id}`, "max");
  }

  return { data: data as Post };
}
