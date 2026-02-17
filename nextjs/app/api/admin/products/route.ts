import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "stuart@terasmediaco.com";
const VALID_STATUSES = ["proposed", "voting", "building", "live", "archived"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
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
      return NextResponse.json(
        { error: `Failed to update product: ${error.message}` },
        { status: 500 },
      );
    }

    revalidateTag(`product-${product_id}`, "max");
    revalidateTag("products", "max");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
