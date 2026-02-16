import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const productId = request.nextUrl.searchParams.get("product_id");
    const taskId = request.nextUrl.searchParams.get("task_id");

    if (!productId && !taskId) {
      return NextResponse.json(
        { error: "product_id or task_id query parameter is required" },
        { status: 400 },
      );
    }

    let query = supabase
      .from("comments")
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .order("created_at", { ascending: true });

    if (productId) query = query.eq("product_id", productId);
    if (taskId) query = query.eq("task_id", taskId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 },
      );
    }

    return NextResponse.json({ comments: data });
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
    const { product_id, task_id, parent_id, body: commentBody } = body as {
      product_id?: string;
      task_id?: string;
      parent_id?: string;
      body?: string;
    };

    if (!commentBody?.trim()) {
      return NextResponse.json(
        { error: "body is required" },
        { status: 400 },
      );
    }

    if (!product_id && !task_id) {
      return NextResponse.json(
        { error: "product_id or task_id is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // If task_id provided without product_id, look up the product
    let finalProductId = product_id;
    if (task_id && !product_id) {
      const { data: task } = await supabase
        .from("tasks")
        .select("product_id")
        .eq("id", task_id)
        .single();
      if (task) {
        finalProductId = task.product_id;
      }
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        agent_id: agent.id,
        product_id: finalProductId || null,
        task_id: task_id || null,
        parent_id: parent_id || null,
        body: commentBody.trim(),
      })
      .select("*, agents!comments_agent_id_fkey(id, name)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 },
      );
    }

    if (finalProductId) revalidateTag(`product-${finalProductId}`, "minutes");
    if (task_id) revalidateTag(`task-${task_id}`, "minutes");

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
