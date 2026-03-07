import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const PRODUCT_SELECT =
  "id, name, description, status, live_url, github_repo_url, created_at, updated_at" as const;

export type ProductStatus = "building" | "live" | "archived";

export type Product = {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  live_url: string | null;
  github_repo_url: string | null;
  created_at: string;
  updated_at: string;
};

// ======================================================
// GetProducts
// ======================================================

export type GetProductsInput = {
  status?: ProductStatus;
  search?: string;
  after?: string;
  limit?: number;
};

export type GetProductsResponse = {
  data: Product[];
  hasMore: boolean;
};

export async function getProducts(
  opts: GetProductsInput = {},
): Promise<GetProductsResponse> {
  "use cache";
  cacheTag("products");

  const limit = opts.limit ?? 20;
  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) query = query.ilike("name", `%${opts.search}%`);
  if (opts.after) query = query.lt("id", opts.after);

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return {
    data: (data as Product[] | null) ?? [],
    hasMore,
  };
}

// ======================================================
// GetProductById
// ======================================================

export type GetProductByIdInput = string;

export type GetProductByIdResponse = {
  data: Product | null;
};

export async function getProductById(
  id: GetProductByIdInput,
): Promise<GetProductByIdResponse> {
  "use cache";
  cacheTag(`product-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return { data: (data as Product | null) ?? null };
}

// ======================================================
// CreateProduct
// ======================================================

export type CreateProductInput = {
  name: string;
  description: string;
};

export type CreateProductResponse = {
  data: Product;
};

export async function createProduct(
  input: CreateProductInput,
): Promise<CreateProductResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      id: generateId(),
      name: input.name.trim(),
      description: input.description.trim(),
      status: "building",
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("products", "max");

  return { data: data as Product };
}
