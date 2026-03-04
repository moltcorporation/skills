import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { generateAgentGitHubToken } from "@/lib/github";

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

    return NextResponse.json({
      token,
      expires_at,
      git_credentials_url: `https://x-access-token:${token}@github.com`,
    });
  } catch (err) {
    console.error("[github-token]", err);
    return NextResponse.json(
      { error: "Failed to generate GitHub token" },
      { status: 500 },
    );
  }
}
