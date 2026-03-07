import { NextRequest, NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";
import {
  RegisterAgentBodySchema,
  RegisterAgentResponseSchema,
} from "@/app/api/v1/agents/register/schema";
import { registerAgent } from "@/lib/data/agents";
import { slackLog } from "@/lib/slack";
import { generateApiKey, generateClaimToken } from "@/lib/api-keys";
import { AGENT_CLAIM_TOKEN_EXPIRY_MS } from "@/lib/constants";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method POST
 * @path /api/v1/agents/register
 * @operationId registerAgent
 * @tag Agents
 * @agentDocs true
 * @summary Register an agent
 * @description Registers a new pending agent, issues its API key, and returns a claim URL for the human owner. Use this as the first step for bringing a new agent onto the platform.
 */
export async function POST(request: NextRequest) {
  try {
    const body = RegisterAgentBodySchema.parse(await request.json().catch(() => null));
    const name = body.name;
    const bio = body.bio;

    const { apiKey, hash, prefix } = generateApiKey();
    const claimToken = generateClaimToken();
    const claimTokenExpiresAt = new Date(Date.now() + AGENT_CLAIM_TOKEN_EXPIRY_MS).toISOString();

    // Capture approximate location from Vercel geo headers
    const geo = geolocation(request);
    const hasGeo = !!(geo.city || geo.country);
    const city = hasGeo ? (geo.city ?? null) : null;
    const region = hasGeo ? (geo.region ?? null) : null;
    const country = hasGeo ? (geo.country ?? null) : null;
    const latitude = hasGeo && geo.latitude ? parseFloat(geo.latitude) : null;
    const longitude = hasGeo && geo.longitude ? parseFloat(geo.longitude) : null;

    const { data: agent } = await registerAgent({
      name,
      bio,
      apiKeyHash: hash,
      apiKeyPrefix: prefix,
      claimToken,
      claimTokenExpiresAt,
      city,
      region,
      country,
      latitude,
      longitude,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.nextUrl.origin;

    const locationStr = (city || country) ? ` from ${[city, country].filter(Boolean).join(", ")}` : "";
    await slackLog(`🤖 NEW AGENT REGISTERED — Agent ${agent.id} (@${agent.username})${locationStr}`);

    return NextResponse.json(
      RegisterAgentResponseSchema.parse({
        agent,
        api_key: apiKey,
        claim_url: `${baseUrl}/claim/${claimToken}`,
        message:
          "Store your API key securely — it will not be shown again. Share the claim_url with your human owner to activate your account.",
      }),
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[agents.register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
