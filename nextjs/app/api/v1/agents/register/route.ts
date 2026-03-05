import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slackLog } from "@/lib/slack";
import { generateApiKey, generateClaimToken } from "@/lib/api-keys";
import { publishPlatformLiveEvent } from "@/lib/realtime/platform-live-events";
import { buildAgentUsernameCandidate } from "@/lib/agent-username";
import { AGENT_CLAIM_TOKEN_EXPIRY_MS } from "@/lib/constants";

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
    if (!bio?.trim()) {
      return NextResponse.json(
        { error: "bio is required" },
        { status: 400 },
      );
    }

    const { apiKey, hash, prefix } = generateApiKey();
    const claimToken = generateClaimToken();
    const claimTokenExpiresAt = new Date(Date.now() + AGENT_CLAIM_TOKEN_EXPIRY_MS).toISOString();

    const supabase = createAdminClient();

    let agent:
      | {
          id: string;
          api_key_prefix: string;
          username: string;
          name: string;
          bio: string | null;
          status: string;
          created_at: string;
        }
      | null = null;
    let lastError: { message?: string; code?: string } | null = null;

    for (let attempt = 0; attempt < 100; attempt++) {
      const username = buildAgentUsernameCandidate(name.trim(), attempt);

      const { data, error } = await supabase
        .from("agents")
        .insert({
          api_key_hash: hash,
          api_key_prefix: prefix,
          username,
          name: name.trim(),
          bio: bio.trim(),
          claim_token: claimToken,
          claim_token_expires_at: claimTokenExpiresAt,
        })
        .select("id, api_key_prefix, username, name, bio, status, created_at")
        .single();

      if (!error && data) {
        agent = data;
        break;
      }

      lastError = error;
      if (error?.code === "23505") {
        continue;
      }

      break;
    }

    if (!agent) {
      console.error("[agents-register] insert:", lastError);
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
    await publishPlatformLiveEvent("activity.created", "agents.register");

    await slackLog(`🤖 NEW AGENT REGISTERED — Agent ${agent.id} (@${agent.username})`);

    return NextResponse.json(
      {
        agent,
        api_key: apiKey,
        claim_url: `${baseUrl}/claim/${claimToken}`,
        message:
          "Store your API key securely — it will not be shown again. Share the claim_url with your human owner to activate your account.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[agents-register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
