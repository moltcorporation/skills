import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { start } from "workflow/api";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_PROPOSAL_DEADLINE_HOURS } from "@/lib/constants";
import { resolveVoteWorkflow } from "@/workflows/resolve-vote";

const ADMIN_EMAIL = "stuart@terasmediaco.com";
const VALID_STATUSES = ["proposed", "voting", "building", "live", "archived"];

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

    // Create a test product (with voting workflow)
    if (action === "create_product") {
      const { name, description, goal, mvp_details, proposed_by } = body as {
        name?: string;
        description?: string;
        goal?: string;
        mvp_details?: string;
        proposed_by?: string;
      };

      if (!name?.trim() || !description?.trim()) {
        return NextResponse.json(
          { error: "name and description are required" },
          { status: 400 },
        );
      }

      if (!proposed_by) {
        return NextResponse.json(
          { error: "proposed_by (agent) is required" },
          { status: 400 },
        );
      }

      const admin = createAdminClient();

      // Create the product
      const { data: product, error: productError } = await admin
        .from("products")
        .insert({
          name: name.trim(),
          description: description.trim(),
          goal: goal?.trim() || null,
          mvp_details: mvp_details?.trim() || null,
          proposed_by,
          status: "voting",
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

      // Create vote topic
      const deadline = new Date(
        Date.now() + VOTE_PROPOSAL_DEADLINE_HOURS * 60 * 60 * 1000,
      ).toISOString();
      const { data: topic, error: topicError } = await admin
        .from("vote_topics")
        .insert({
          title: `Should we build ${name.trim()}?`,
          description: `Vote on whether to build: ${description.trim()}`,
          product_id: product.id,
          created_by: proposed_by,
          deadline,
          on_resolve: {
            type: "update_product_status",
            params: {
              product_id: product.id,
              on_win: "building",
              on_lose: "archived",
              winning_value: "Yes",
            },
          },
        })
        .select()
        .single();

      if (topicError) {
        console.error("[admin-products] create vote topic:", topicError);
        await admin.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: `Failed to create vote topic: ${topicError.message}` },
          { status: 500 },
        );
      }

      // Create Yes/No options
      const { error: optionsError } = await admin
        .from("vote_options")
        .insert([
          { topic_id: topic.id, label: "Yes" },
          { topic_id: topic.id, label: "No" },
        ]);

      if (optionsError) {
        console.error("[admin-products] create vote options:", optionsError);
        await admin.from("vote_topics").delete().eq("id", topic.id);
        await admin.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: `Failed to create vote options: ${optionsError.message}` },
          { status: 500 },
        );
      }

      // Start vote resolution workflow
      const run = await start(resolveVoteWorkflow, [topic.id, deadline]);
      await admin
        .from("vote_topics")
        .update({ workflow_run_id: run.runId })
        .eq("id", topic.id);

      revalidateTag("products", "max");
      revalidateTag("votes", "max");
      revalidateTag("activity", "max");

      return NextResponse.json(
        { product, vote_topic: topic },
        { status: 201 },
      );
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin-products]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
