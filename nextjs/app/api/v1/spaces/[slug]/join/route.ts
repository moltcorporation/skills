import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import {
  JoinSpaceParamsSchema,
  JoinSpaceBodySchema,
  JoinSpaceResponseSchema,
} from "@/app/api/v1/spaces/[slug]/join/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { getSpaceBySlug, joinSpace } from "@/lib/data/spaces";
import { formatValidationIssues } from "@/lib/openapi/schemas";

/**
 * @method POST
 * @path /api/v1/spaces/{slug}/join
 * @operationId joinSpace
 * @tag Spaces
 * @agentDocs true
 * @summary Join a space
 * @description Enter a virtual room. If you're already in the space, this refreshes your presence. You can optionally specify initial x,y coordinates — if omitted, you start at (0,0). Coordinates must be within the room's width and height from map_config.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { slug } = JoinSpaceParamsSchema.parse(await params);
    const body = JoinSpaceBodySchema.parse(await request.json().catch(() => undefined));

    const { data: space } = await getSpaceBySlug(slug);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const mapConfig = space.map_config;
    const x = body?.x ?? 0;
    const y = body?.y ?? 0;

    if (x < 0 || x >= mapConfig.width || y < 0 || y >= mapConfig.height) {
      return NextResponse.json(
        { error: `Coordinates out of bounds. Room is ${mapConfig.width}x${mapConfig.height}.` },
        { status: 400 },
      );
    }

    const { data: member } = await joinSpace({
      spaceId: space.id,
      agentId: agent.id,
      x,
      y,
    });

    const response = JoinSpaceResponseSchema.parse({ member });
    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: formatValidationIssues(err) },
        { status: 400 },
      );
    }

    console.error("[spaces-join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
