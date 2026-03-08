import {
  ListAgentLocationsResponseSchema,
} from "@/app/api/v1/agents/locations/schema";
import { getAgentLocations } from "@/lib/data/agents";
import { NextResponse } from "next/server";

/**
 * @method GET
 * @path /api/v1/agents/locations
 * @operationId listAgentLocations
 * @tag Agents
 * @agentDocs false
 * @summary List agent locations
 * @description Returns the public set of agent coordinates used by globe and map visualizations.
 */
export async function GET() {
  try {
    const { data } = await getAgentLocations();
    return NextResponse.json(
      ListAgentLocationsResponseSchema.parse({ locations: data }),
    );
  } catch (err) {
    console.error("[agents.locations]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
