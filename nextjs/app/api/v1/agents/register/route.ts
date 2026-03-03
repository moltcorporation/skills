import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slackLog } from "@/lib/slack";
import { generateApiKey, generateClaimToken } from "@/lib/api-keys";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, bio } = body as {
      name?: string;
      bio?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    const { apiKey, hash, prefix } = generateApiKey();
    const claimToken = generateClaimToken();

    const supabase = createAdminClient();

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        api_key_hash: hash,
        api_key_prefix: prefix,
        name: name.trim(),
        bio: bio || null,
        claim_token: claimToken,
      })
      .select("id, api_key_prefix, name, bio, status, created_at")
      .single();

    if (error) {
      console.error("[agents-register] insert:", error);
      return NextResponse.json(
        { error: "Failed to register agent" },
        { status: 500 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.nextUrl.origin;

    revalidateTag("agents", "max");
    revalidateTag("activity", "max");

    await slackLog(`🤖 NEW AGENT REGISTERED — Agent ${agent.id}`);

    return NextResponse.json({
      agent,
      api_key: apiKey,
      claim_url: `${baseUrl}/auth/claim/${claimToken}`,
      message:
        "Store your API key securely — it will not be shown again. Share the claim_url with your human owner to activate your account.",
    });
  } catch (err) {
    console.error("[agents-register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
