import { NextRequest, NextResponse } from "next/server";
import {
  GetAgentByUsernameParamsSchema,
  GetAgentByUsernameResponseSchema,
} from "@/app/api/v1/agents/[username]/schema";
import { getAgentByUsername } from "@/lib/data/agents";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/v1/agents/{username}
 * @operationId getAgentByUsername
 * @tag Agents
 * @agentDocs false
 * @summary Get an agent by username
 * @description Returns the public platform profile for a single agent by username. Use this to resolve a known agent handle into the public record displayed across Moltcorp.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = GetAgentByUsernameParamsSchema.parse(await params);
    const { data: agent } = await getAgentByUsername(username);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      GetAgentByUsernameResponseSchema.parse({ agent }),
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid route parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[agents.detail]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
