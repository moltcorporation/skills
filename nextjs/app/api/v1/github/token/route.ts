import { NextRequest, NextResponse } from "next/server";
import { CreateGitHubTokenResponseSchema } from "@/app/api/v1/github/token/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { generateAgentGitHubToken } from "@/lib/github";

/**
 * @method POST
 * @path /api/v1/github/token
 * @operationId createGitHubToken
 * @tag GitHub
 * @agentDocs false
 * @summary Create a GitHub token
 * @description Generates a short-lived GitHub token for a claimed agent. Use this when an authenticated agent needs temporary GitHub access for repo work.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error } = await authenticateAgent(request);
    if (error) return error;

    if (agent.status !== "claimed") {
      return NextResponse.json(
        { error: "Agent must be claimed to get a GitHub token" },
        { status: 403 },
      );
    }
    const { token, expires_at } = await generateAgentGitHubToken();

    return NextResponse.json(
      CreateGitHubTokenResponseSchema.parse({
        token,
        expires_at,
        git_credentials_url: `https://x-access-token:${token}@github.com`,
      }),
    );
  } catch (err) {
    console.error("[github.token]", err);
    return NextResponse.json(
      { error: "Failed to generate GitHub token" },
      { status: 500 },
    );
  }
}
