import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteGitHubRepo } from "@/lib/github";
import { deleteNeonProject } from "@/lib/neon";
import { deleteVercelProject } from "@/lib/vercel";
import { provisionProduct } from "@/lib/provisioning";

const ADMIN_EMAIL = "stuart@terasmediaco.com";
const VALID_STATUSES = ["concept", "building", "live", "archived"];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    // Create a product
    if (action === "create_product") {
      const { name, description } = body as {
        name?: string;
        description?: string;
      };

      if (!name?.trim() || !description?.trim()) {
        return NextResponse.json(
          { error: "name and description are required" },
          { status: 400 },
        );
      }

      const admin = createAdminClient();

      const { data: product, error: productError } = await admin
        .from("products")
        .insert({
          name: name.trim(),
          description: description.trim(),
          status: "concept",
        })
        .select()
        .single();

      if (productError) {
        console.error("[admin-products] create:", productError);
        return NextResponse.json(
          { error: `Failed to create product: ${productError.message}` },
          { status: 500 },
        );
      }

      revalidateTag("products", "max");

      // Trigger provisioning in background
      provisionProduct(product.id).catch((err) => {
        console.error("[admin-products] provisioning failed:", err);
      });

      return NextResponse.json({ product }, { status: 201 });
    }

    // Update product status (default action)
    const { product_id, status } = body as {
      product_id?: string;
      status?: string;
    };

    if (!product_id || !status) {
      return NextResponse.json(
        { error: "product_id and status are required" },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("products")
      .update({ status })
      .eq("id", product_id);

    if (error) {
      console.error("[admin-products] update:", error);
      return NextResponse.json(
        { error: `Failed to update product: ${error.message}` },
        { status: 500 },
      );
    }

    revalidateTag(`product-${product_id}`, "max");
    revalidateTag("products", "max");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin-products]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { product_id } = body as { product_id?: string };

    if (!product_id) {
      return NextResponse.json(
        { error: "product_id is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: product, error: fetchError } = await admin
      .from("products")
      .select("id, github_repo_id, neon_project_id, vercel_project_id")
      .eq("id", product_id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const cleanupResults: { resource: string; success: boolean; error?: string }[] = [];
    const cleanupTasks: Promise<void>[] = [];

    if (product.github_repo_id) {
      cleanupTasks.push(
        deleteGitHubRepo(product.github_repo_id)
          .then(() => { cleanupResults.push({ resource: "github", success: true }); })
          .catch((err) => {
            console.error("[admin-products] delete github repo:", err);
            cleanupResults.push({ resource: "github", success: false, error: String(err) });
          }),
      );
    }

    if (product.neon_project_id) {
      cleanupTasks.push(
        deleteNeonProject(product.neon_project_id)
          .then(() => { cleanupResults.push({ resource: "neon", success: true }); })
          .catch((err) => {
            console.error("[admin-products] delete neon project:", err);
            cleanupResults.push({ resource: "neon", success: false, error: String(err) });
          }),
      );
    }

    if (product.vercel_project_id) {
      cleanupTasks.push(
        deleteVercelProject(product.vercel_project_id)
          .then(() => { cleanupResults.push({ resource: "vercel", success: true }); })
          .catch((err) => {
            console.error("[admin-products] delete vercel project:", err);
            cleanupResults.push({ resource: "vercel", success: false, error: String(err) });
          }),
      );
    }

    await Promise.all(cleanupTasks);

    const { error } = await admin
      .from("products")
      .delete()
      .eq("id", product_id);

    if (error) {
      console.error("[admin-products] delete:", error);
      return NextResponse.json(
        { error: `Failed to delete product: ${error.message}` },
        { status: 500 },
      );
    }

    revalidateTag(`product-${product_id}`, "max");
    revalidateTag("products", "max");

    return NextResponse.json({ success: true, cleanup: cleanupResults });
  } catch (err) {
    console.error("[admin-products]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
