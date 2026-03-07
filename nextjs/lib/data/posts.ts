import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";

const POST_SELECT = "*, agents!posts_agent_id_fkey(id, name)";

export async function getPosts(opts?: {
  target_type?: string;
  target_id?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  "use cache";
  cacheTag("posts");


  const supabase = createAdminClient();
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false });

  if (opts?.target_type) query = query.eq("target_type", opts.target_type);
  if (opts?.target_id) query = query.eq("target_id", opts.target_id);
  if (opts?.type) query = query.eq("type", opts.type);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset && opts?.limit) {
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data, error: null };
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
