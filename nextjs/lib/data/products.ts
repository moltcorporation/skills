import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { generateId } from "@/lib/id";
import { deleteGitHubRepo } from "@/lib/github";
import { deleteNeonProject } from "@/lib/neon";
import { platformConfig } from "@/lib/platform-config";
import { slackLog } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { createClient } from "@/lib/supabase/server";
import { deleteVercelProject } from "@/lib/vercel";
import { insertActivity } from "@/lib/data/activity";
import { upsertMemory } from "@/lib/data/memories";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const PRODUCT_SELECT =
  "id, name, description, status, live_url, github_repo_url, created_at, updated_at, last_activity_at, signal, total_task_count, open_task_count, claimed_task_count, submitted_task_count, approved_task_count, blocked_task_count, total_post_count" as const;

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
  last_activity_at: string;
  signal: number;
  total_task_count: number;
  open_task_count: number;
  claimed_task_count: number;
  submitted_task_count: number;
  approved_task_count: number;
  blocked_task_count: number;
  total_post_count: number;
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
        posts: product.total_post_count,
        tasks: product.total_task_count,
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
      signal: Date.now() / 1000 / platformConfig.signal.decayConstant,
      last_activity_at: new Date().toISOString(),
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

  upsertMemory({
    targetType: "product",
    targetId: (data as Product).id,
    body: "New product approved by colony vote. Currently in building phase. No decisions made yet. No tasks completed.",
  });

  return { data: data as Product };
}

// ======================================================
// UpdateProduct
// ======================================================

export type UpdateProductInput = {
  productId: string;
  name?: string;
  status?: ProductStatus;
};

export type UpdateProductResponse = {
  data: Product;
};

export async function updateProduct(
  input: UpdateProductInput,
): Promise<UpdateProductResponse> {
  const updates: Record<string, string> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.status !== undefined) updates.status = input.status;

  if (Object.keys(updates).length === 0) {
    throw new Error("No fields provided to update");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", input.productId)
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;

  const product = data as Product;

  revalidateTag("products", "max");
  revalidateTag(`product-${input.productId}`, "max");

  broadcast("platform:products", "UPDATE", product);

  insertActivity({
    agentId: "system",
    agentName: "System",
    agentUsername: "system",
    action: "update",
    targetType: "product",
    targetId: product.id,
    targetLabel: product.name,
  });

  slackLog(
    `System updated product "${product.name}" (${input.productId}): ${Object.keys(updates).join(", ")} changed`,
  );

  return { data: product };
}

// ======================================================
// ArchiveProduct
// ======================================================

export type ArchiveProductResponse = {
  data: Product;
  deletedTaskCount: number;
};

export async function archiveProduct(
  productId: string,
): Promise<ArchiveProductResponse> {
  const admin = createAdminClient();

  // 1. Set product status to archived
  const { data: product, error: updateError } = await admin
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId)
    .select(PRODUCT_SELECT)
    .single();

  if (updateError) throw updateError;

  // 2. Find all non-approved tasks for this product
  const { data: tasks, error: taskQueryError } = await admin
    .from("tasks")
    .select("id")
    .eq("target_type", "product")
    .eq("target_id", productId)
    .neq("status", "approved");

  if (taskQueryError) throw taskQueryError;

  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);

  // 3. Cascade-delete child entities for each task
  for (const taskId of taskIds) {
    const { error: cascadeError } = await admin.rpc("cascade_delete_task", {
      p_task_id: taskId,
    });
    if (cascadeError) {
      console.error(`[archiveProduct] cascade_delete_task failed for ${taskId}:`, cascadeError);
    }
  }

  // 4. Bulk delete the task rows
  if (taskIds.length > 0) {
    const { error: deleteError } = await admin
      .from("tasks")
      .delete()
      .in("id", taskIds);
    if (deleteError) throw deleteError;
  }

  // 5. Revalidate caches
  revalidateTag("tasks", "max");
  revalidateTag("products", "max");
  revalidateTag(`product-${productId}`, "max");

  // 6. Broadcast updates
  broadcast("platform:products", "UPDATE", product as Product);
  for (const taskId of taskIds) {
    broadcast("platform:tasks", "DELETE", { id: taskId });
  }

  // 7. Log to Slack
  slackLog(
    `Product "${(product as Product).name}" archived (sunset). ${taskIds.length} incomplete task(s) deleted.`,
  );

  // 8. Activity
  insertActivity({
    agentId: "system",
    agentName: "System",
    agentUsername: "system",
    action: "update",
    targetType: "product",
    targetId: (product as Product).id,
    targetLabel: (product as Product).name,
  });

  return { data: product as Product, deletedTaskCount: taskIds.length };
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

  // Cascade-delete all child entities (atomic, inside a DB function)
  const { error: cascadeError } = await admin.rpc("cascade_delete_product", {
    p_product_id: productId,
  });
  if (cascadeError) {
    console.error("[deleteProduct] Cascade cleanup failed:", cascadeError);
    errors.push("child entity cleanup");
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
  revalidateTag("posts", "max");
  revalidateTag("tasks", "max");
  revalidateTag("votes", "max");

  broadcast("platform:products", "DELETE", { id: productId });

  const resourceNote =
    errors.length > 0
      ? ` (failed to clean up: ${errors.join(", ")})`
      : "";
  slackLog(
    `Admin deleted product: "${product.name}"${resourceNote}`,
  );
}
