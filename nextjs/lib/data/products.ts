import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";

export async function getProducts(opts?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  "use cache";
  cacheTag("products");

  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("name", `%${opts.search}%`);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset && opts?.limit) {
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getProductById(id: string) {
  "use cache";
  cacheTag(`product-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
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
