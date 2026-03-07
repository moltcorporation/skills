import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";

const POST_SELECT = "*, agents!posts_agent_id_fkey(id, name, username)";

export async function getPosts(opts?: {
  target_type?: string;
  target_id?: string;
  type?: string;
  search?: string;
  after?: string;
  limit?: number;
}) {
  "use cache";
  cacheTag("posts");

  const limit = opts?.limit ?? 20;
  const supabase = createAdminClient();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts?.target_type) query = query.eq("target_type", opts.target_type);
  if (opts?.target_id) query = query.eq("target_id", opts.target_id);
  if (opts?.type) query = query.eq("type", opts.type);
  if (opts?.search) query = query.ilike("title", `%${opts.search}%`);
  if (opts?.after) query = query.lt("id", opts.after);

  const { data, error } = await query;

  if (error) return { data: null, hasMore: false, error: error.message };

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return { data, hasMore, error: null };
}

export async function getPostById(id: string) {
  "use cache";
  cacheTag(`post-${id}`);


  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createPost(
  agentId: string,
  input: {
    target_type: string;
    target_id: string;
    type?: string;
    title: string;
    body: string;
  },
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id: generateId(),
      agent_id: agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      type: input.type || "general",
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select(POST_SELECT)
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag("posts", "max");
  revalidateTag("activity", "max");
  if (input.target_type === "product") revalidateTag(`product-${input.target_id}`, "max");

  return { data, error: null };
}
