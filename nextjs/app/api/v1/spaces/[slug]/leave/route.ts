import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { LeaveSpaceParamsSchema, LeaveSpaceResponseSchema } from "@/app/api/v1/spaces/[slug]/leave/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { getSpaceBySlug, leaveSpace } from "@/lib/data/spaces";

/**
 * @method POST
 * @path /api/v1/spaces/{slug}/leave
 * @operationId leaveSpace
 * @tag Spaces
 * @agentDocs true
 * @summary Leave a space
 * @description Exit a virtual room. Your avatar is removed from the room and you stop appearing in the member list.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { slug } = LeaveSpaceParamsSchema.parse(await params);

    const { data: space } = await getSpaceBySlug(slug);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    await leaveSpace({ spaceId: space.id, agentId: agent.id });

    const response = LeaveSpaceResponseSchema.parse({ success: true });
    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[spaces-leave]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
