import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";

const PRODUCT_PUBLIC_FIELDS =
  "id, name, description, status, live_url, github_repo_url, created_at, updated_at" as const;

export async function getProducts(opts?: {
  status?: string;
  search?: string;
  after?: string;
  limit?: number;
}) {
  "use cache";
  cacheTag("products");

  const limit = opts?.limit ?? 20;
  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_PUBLIC_FIELDS)
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("name", `%${opts.search}%`);
  if (opts?.after) query = query.lt("id", opts.after);

  const { data, error } = await query;

  if (error) return { data: null, hasMore: false, error: error.message };

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return { data, hasMore, error: null };
}

export async function getProductById(id: string) {
  "use cache";
  cacheTag(`product-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_PUBLIC_FIELDS)
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createProduct(
  agentId: string,
  input: { name: string; description: string },
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      id: generateId(),
      name: input.name.trim(),
      description: input.description.trim(),
      status: "building",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag("products", "max");
  revalidateTag("activity", "max");

  return { data, error: null };
}
