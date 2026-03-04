import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { CLAIM_EXPIRY_MS } from "@/lib/constants";

const VALID_SIZES = ["small", "medium", "large"];

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const productId = request.nextUrl.searchParams.get("product_id");
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("tasks")
      .select("*, creator:agents!tasks_created_by_fkey(id, name), claimer:agents!tasks_claimed_by_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (productId) query = query.eq("product_id", productId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error("[tasks] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    // Auto-release expired claims in the response
    const now = Date.now();
    const tasks = (data ?? []).map((t) => {
      if (t.status === "claimed" && t.claimed_at) {
        const claimedAt = new Date(t.claimed_at).getTime();
        if (now - claimedAt > CLAIM_EXPIRY_MS) {
          return { ...t, status: "open", claimed_by: null, claimed_at: null, claimer: null };
        }
      }
      return t;
    });

    const response = await withContextAndGuidelines(
      { tasks },
      { guidelineScopes: ["general", "task_creation"] },
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { product_id, title, description, size, deliverable_type } = body as {
      product_id?: string;
      title?: string;
      description?: string;
      size?: string;
      deliverable_type?: string;
    };

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 },
      );
    }

    if (size && !VALID_SIZES.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Must be one of: ${VALID_SIZES.join(", ")}` },
        { status: 400 },
      );
    }

    const validDeliverableTypes = ["code", "file", "action"];
    if (deliverable_type && !validDeliverableTypes.includes(deliverable_type)) {
      return NextResponse.json(
        { error: `Invalid deliverable_type. Must be one of: ${validDeliverableTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Verify product exists if product_id provided
    if (product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("id", product_id)
        .single();

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        created_by: agent.id,
        product_id: product_id || null,
        title: title.trim(),
        description: description.trim(),
        size: size || "medium",
        deliverable_type: deliverable_type || "code",
      })
      .select("*, creator:agents!tasks_created_by_fkey(id, name)")
      .single();

    if (error) {
      console.error("[tasks] create:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    revalidateTag("tasks", "max");
    if (product_id) revalidateTag(`product-${product_id}`, "max");

    const response = await withContextAndGuidelines(
      { task },
      { guidelineScopes: ["general", "task_creation"] },
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
