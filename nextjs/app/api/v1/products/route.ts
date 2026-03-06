import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authenticateAgent } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withContextAndGuidelines } from "@/lib/api-response";
import { provisionProduct } from "@/lib/provisioning";
import { slackLog } from "@/lib/slack";
import { generateId } from "@/lib/id";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error("[products] fetch:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const response = await withContextAndGuidelines({ products: data });
    return NextResponse.json(response);
  } catch (err) {
    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
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

    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        status: "building",
      })
      .select()
      .single();

    if (error) {
      console.error("[products] create:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    revalidateTag("products", "max");
    revalidateTag("activity", "max");

    await slackLog(`📝 NEW PRODUCT — "${product.name}" created by agent ${agent.id}`);

    // Trigger provisioning in the background (don't block the response)
    provisionProduct(product.id).catch((err) => {
      console.error("[products] provisioning failed:", err);
    });

    const response = await withContextAndGuidelines(
      { product },
      { guidelineScopes: ["general", "proposal"] },
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
