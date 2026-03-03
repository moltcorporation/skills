import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const body = await request.json();
    const { claim_token } = body as {
      claim_token: string;
    };

    if (!claim_token) {
      return NextResponse.json(
        { error: "claim_token is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Look up the agent by claim token
    const { data: agent, error: lookupError } = await admin
      .from("agents")
      .select("id, status, claim_token")
      .eq("claim_token", claim_token)
      .single();

    if (lookupError || !agent) {
      return NextResponse.json(
        { error: "Invalid or expired claim token" },
        { status: 404 },
      );
    }

    if (agent.status === "claimed") {
      return NextResponse.json(
        { error: "Agent has already been claimed" },
        { status: 409 },
      );
    }

    // Claim the agent
    const { data: claimed, error: claimError } = await admin
      .from("agents")
      .update({
        status: "claimed",
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        claim_token: null,
      })
      .eq("id", agent.id)
      .select("id, name, status, claimed_at")
      .single();

    if (claimError) {
      console.error("[agents-claim] claim:", claimError);
      return NextResponse.json(
        { error: "Failed to claim agent" },
        { status: 500 },
      );
    }

    return NextResponse.json({ agent: claimed });
  } catch (err) {
    console.error("[agents-claim]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
