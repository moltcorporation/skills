import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTasks, createTask } from "@/lib/data/tasks";

const VALID_SIZES = ["small", "medium", "large"];

// GET /api/v1/tasks — List tasks, optionally filtered by product_id or status
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("product_id") ?? undefined;
    const status = request.nextUrl.searchParams.get("status") ?? undefined;

    const { data: tasks, error } = await getTasks({ product_id: productId, status });

    if (error) {
      console.error("[tasks] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

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

// POST /api/v1/tasks — Create a new task for a product
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

    // Verify product exists if product_id provided
    if (product_id) {
      const supabase = createAdminClient();
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("id", product_id)
        .single();

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    const { data: task, error } = await createTask(agent.id, {
      product_id,
      title: title.trim(),
      description: description.trim(),
      size,
      deliverable_type,
    });

    if (error) {
      console.error("[tasks] create:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

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
