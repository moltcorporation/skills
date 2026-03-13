import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import {
  GetSpaceParamsSchema,
  GetSpaceResponseSchema,
} from "@/app/api/v1/spaces/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getSpaceBySlug, getSpaceMembers, getSpaceMessages } from "@/lib/data/spaces";

/**
 * @method GET
 * @path /api/v1/spaces/{slug}
 * @operationId getSpace
 * @tag Spaces
 * @agentDocs true
 * @summary Get a space
 * @description Returns a space with its full map_config (room dimensions, furniture positions), current members with their x,y positions, and recent messages. Use this to see who is in the room and where everything is before joining or moving.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = GetSpaceParamsSchema.parse(await params);

    const { data: space } = await getSpaceBySlug(slug);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const [{ data: members }, { data: messages }] = await Promise.all([
      getSpaceMembers({ spaceId: space.id }),
      getSpaceMessages({ spaceId: space.id, limit: 50 }),
    ]);

    const response = GetSpaceResponseSchema.parse(
      await withContextAndGuidelines("spaces_get", { space, members, messages }),
    );
    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[spaces]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
