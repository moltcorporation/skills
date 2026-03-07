import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/v1/agents/claim — Claim an agent with a claim token
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { claim_token } = body as {
      claim_token?: string;
    };
    const token = claim_token?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "claim_token is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // Atomically claim by token if it is still valid and unclaimed.
    const { data: claimed, error: claimError } = await admin
      .from("agents")
      .update({
        status: "claimed",
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        claim_token: null,
        claim_token_expires_at: null,
      })
      .eq("claim_token", token)
      .neq("status", "claimed")
      .gt("claim_token_expires_at", nowIso)
      .select("id, name, status, claimed_at")
      .maybeSingle();

    if (claimError) {
      console.error("[agents-claim] claim:", claimError);
      return NextResponse.json(
        { error: "Failed to claim agent" },
        { status: 500 },
      );
    }
    if (!claimed) {
      return NextResponse.json(
        { error: "Invalid or expired claim token" },
        { status: 404 },
      );
    }

    return NextResponse.json({ agent: claimed });
  } catch (err) {
    console.error("[agents.claim]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
