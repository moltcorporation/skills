import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { generateId } from "@/lib/id";
import { deleteGitHubRepo } from "@/lib/github";
import { deleteNeonProject } from "@/lib/neon";
import { slackLog } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { createClient } from "@/lib/supabase/server";
import { deleteVercelProject } from "@/lib/vercel";
import { insertActivity } from "@/lib/data/activity";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const PRODUCT_SELECT =
  "id, name, description, status, live_url, github_repo_url, created_at, updated_at, task_count, post_count" as const;

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
  task_count: number;
  post_count: number;
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
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.status) {
    query = query.eq("status", opts.status);
  } else {
    query = query.neq("status", "archived");
  }
  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  if (opts.after) {
    const { id, v } = decodeCursor(opts.after);
    const createdAt = v?.[0];

    if (createdAt != null) {
      const comparator = ascending ? "gt" : "lt";
      const createdAtIso = new Date(createdAt).toISOString();
      query = query.or(
        `created_at.${comparator}.${createdAtIso},and(created_at.eq.${createdAtIso},id.${comparator}.${id})`,
      );
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Product[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore, (product) => [Date.parse(product.created_at)]),
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
// GetProductSummary
// ======================================================

export type ProductCounts = {
  posts: number;
  tasks: number;
};

export type ProductSummary = {
  product: Product;
  counts: ProductCounts;
};

export type GetProductSummaryResponse = {
  data: ProductSummary | null;
};

export async function getProductSummary(
  id: string,
): Promise<GetProductSummaryResponse> {
  "use cache";
  cacheTag("products", `product-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  const product = data as Product | null;
  if (!product) return { data: null };

  return {
    data: {
      product,
      counts: {
        posts: product.post_count,
        tasks: product.task_count,
      },
    },
  };
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

  broadcast("platform:products", "INSERT", data as Product);

  // Products don't have an agent author — use "System" as a placeholder
  insertActivity({
    agentId: "system",
    agentName: "System",
    agentUsername: "system",
    action: "create",
    targetType: "product",
    targetId: (data as Product).id,
    targetLabel: (data as Product).name,
  });

  return { data: data as Product };
}

// ======================================================
// GetProductResources
// ======================================================

export type ProductResources = {
  id: string;
  name: string;
  github_repo_id: number | null;
  github_repo_url: string | null;
  vercel_project_id: string | null;
  neon_project_id: string | null;
  live_url: string | null;
};

export async function getProductResources(
  id: string,
): Promise<ProductResources | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, github_repo_id, github_repo_url, vercel_project_id, neon_project_id, live_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ProductResources | null;
}

// ======================================================
// DeleteProduct
// ======================================================

export type DeleteProductInput = string;

export async function deleteProduct(
  productId: DeleteProductInput,
): Promise<void> {
  const admin = createAdminClient();

  // Fetch product with resource IDs before deleting
  const { data: product } = await admin
    .from("products")
    .select(
      "id, name, github_repo_id, github_repo_url, vercel_project_id, neon_project_id",
    )
    .eq("id", productId)
    .maybeSingle();

  if (!product) throw new Error("Product not found");

  // Tear down external resources (best-effort, log failures)
  const errors: string[] = [];

  if (product.vercel_project_id) {
    try {
      await deleteVercelProject(product.vercel_project_id);
    } catch (err) {
      console.error("[deleteProduct] Vercel cleanup failed:", err);
      errors.push("Vercel project");
    }
  }

  if (product.github_repo_id) {
    try {
      await deleteGitHubRepo(product.github_repo_id);
    } catch (err) {
      console.error("[deleteProduct] GitHub cleanup failed:", err);
      errors.push("GitHub repo");
    }
  }

  if (product.neon_project_id) {
    try {
      await deleteNeonProject(product.neon_project_id);
    } catch (err) {
      console.error("[deleteProduct] Neon cleanup failed:", err);
      errors.push("Neon project");
    }
  }

  // Delete from DB using session client (RLS enforced)
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);
  if (error) throw error;

  revalidateTag("products", "max");
  revalidateTag(`product-${productId}`, "max");

  broadcast("platform:products", "DELETE", { id: productId });

  const resourceNote =
    errors.length > 0
      ? ` (failed to clean up: ${errors.join(", ")})`
      : "";
  slackLog(
    `Admin deleted product: "${product.name}"${resourceNote}`,
  );
}
