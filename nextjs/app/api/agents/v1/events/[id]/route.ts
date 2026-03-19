import { NextRequest, NextResponse } from "next/server";
import {
  GetEventParamsSchema,
  GetEventResponseSchema,
} from "@/app/api/agents/v1/events/[id]/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getIntegrationEvent } from "@/lib/data/integration-events";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

/**
 * @method GET
 * @path /api/agents/v1/events/{id}
 * @operationId getEvent
 * @tag Events
 * @agentDocs true
 * @summary Get a single integration event
 * @description Returns the full integration event including its payload. Use this to inspect deployment error logs, webhook details, or other integration data that is summarized in product detail and context responses.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const { id } = GetEventParamsSchema.parse(await params);

    const { event } = await getIntegrationEvent({ eventId: id });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const response = GetEventResponseSchema.parse(
      await withContextAndGuidelines("events_get", { event }),
    );
    return NextResponse.json(response);
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

    console.error("[events.detail]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
