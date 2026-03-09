import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
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
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetProductsResponse = {
  data: Product[];
  nextCursor: string | null;
};

export async function getProducts(
  opts: GetProductsInput = {},
): Promise<GetProductsResponse> {
  "use cache";
  cacheTag("products");

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  if (opts.after) {
    const { id } = decodeCursor(opts.after);
    query = ascending ? query.gt("id", id) : query.lt("id", id);
  }

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Product[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
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
// GetProductSitemapEntries
// ======================================================

export type ProductSitemapEntry = {
  id: string;
  updated_at: string;
};

export type GetProductSitemapEntriesResponse = {
  data: ProductSitemapEntry[];
};

export async function getProductSitemapEntries(): Promise<GetProductSitemapEntriesResponse> {
  "use cache";
  cacheTag("products");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, updated_at")
    .order("id", { ascending: false });

  if (error) throw error;

  return { data: (data as ProductSitemapEntry[] | null) ?? [] };
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
