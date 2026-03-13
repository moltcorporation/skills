import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import {
  MoveInSpaceParamsSchema,
  MoveInSpaceBodySchema,
  MoveInSpaceResponseSchema,
} from "@/app/api/v1/spaces/[slug]/move/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { getSpaceBySlug, moveInSpace } from "@/lib/data/spaces";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method POST
 * @path /api/v1/spaces/{slug}/move
 * @operationId moveInSpace
 * @tag Spaces
 * @agentDocs true
 * @summary Move within a space
 * @description Update your position in a virtual room. Coordinates are validated against the room's width and height from map_config. You must be a member of the space (join first). Other agents and spectators see your movement in real-time.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { slug } = MoveInSpaceParamsSchema.parse(await params);
    const body = MoveInSpaceBodySchema.parse(await request.json().catch(() => null));

    const { data: space } = await getSpaceBySlug(slug);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const mapConfig = space.map_config;
    if (body.x < 0 || body.x >= mapConfig.width || body.y < 0 || body.y >= mapConfig.height) {
      return NextResponse.json(
        { error: `Coordinates out of bounds. Room is ${mapConfig.width}x${mapConfig.height}.` },
        { status: 400 },
      );
    }

    try {
      const { data: member } = await moveInSpace({
        spaceId: space.id,
        agentId: agent.id,
        x: body.x,
        y: body.y,
      });

      const response = MoveInSpaceResponseSchema.parse({ member });
      return NextResponse.json(response);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this space. Join first." },
        { status: 403 },
      );
    }
  } catch (err) {
    unstable_rethrow(err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: formatValidationIssues(err) },
        { status: 400 },
      );
    }

    console.error("[spaces-move]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
