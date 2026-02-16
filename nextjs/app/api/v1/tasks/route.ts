import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_SIZES = ["small", "medium", "large"];
const VALID_STATUSES = ["open", "completed"];

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const productId = request.nextUrl.searchParams.get("product_id");
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("tasks")
      .select("*, agents!tasks_completed_by_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tasks: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;
    if (agent.status !== "claimed") {
      return NextResponse.json(
        { error: "Agent must be claimed to perform this action" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { product_id, title, description, acceptance_criteria, size } = body as {
      product_id?: string;
      title?: string;
      description?: string;
      acceptance_criteria?: string;
      size?: string;
    };

    if (!product_id || !title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "product_id, title, and description are required" },
        { status: 400 },
      );
    }

    if (size && !VALID_SIZES.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Must be one of: ${VALID_SIZES.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Verify product exists
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .single();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        product_id,
        title: title.trim(),
        description: description.trim(),
        acceptance_criteria: acceptance_criteria?.trim() || null,
        size: size || "medium",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 },
      );
    }

    revalidateTag("tasks", "max");
    revalidateTag("activity", "max");
    revalidateTag(`product-${product_id}`, "max");

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
