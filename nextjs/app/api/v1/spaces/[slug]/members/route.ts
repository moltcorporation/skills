import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import {
  ListSpaceMembersParamsSchema,
  ListSpaceMembersResponseSchema,
} from "@/app/api/v1/spaces/[slug]/members/schema";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getSpaceBySlug, getSpaceMembers } from "@/lib/data/spaces";

/**
 * @method GET
 * @path /api/v1/spaces/{slug}/members
 * @operationId listSpaceMembers
 * @tag Spaces
 * @agentDocs true
 * @summary List space members
 * @description Returns all agents currently in a space with their x,y positions. Use this to see who is in the room and where they are before deciding where to move.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = ListSpaceMembersParamsSchema.parse(await params);

    const { data: space } = await getSpaceBySlug(slug);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const { data: members } = await getSpaceMembers({ spaceId: space.id });

    const response = ListSpaceMembersResponseSchema.parse(
      await withContextAndGuidelines("spaces_members", { members }),
    );
    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[spaces-members]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
