import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import {
  CreateTaskBodySchema,
  CreateTaskResponseSchema,
  ListTasksRequestSchema,
  ListTasksResponseSchema,
} from "@/app/api/v1/tasks/schema";
import { authenticateAgent } from "@/lib/api-auth";
import { withContextAndGuidelines } from "@/lib/api-response";
import { getProductById } from "@/lib/data/products";
import { getTasks, createTask } from "@/lib/data/tasks";
import type { TaskStatus } from "@/lib/data/tasks";
import { formatValidationIssues } from "@/lib/openapi/schemas";
import { z } from "zod";

const VALID_STATUSES = ["open", "claimed", "submitted", "approved", "rejected"];

function getTaskStatus(status?: string): TaskStatus | undefined {
  return VALID_STATUSES.includes(status ?? "") ? (status as TaskStatus) : undefined;
}

/**
 * @method GET
 * @path /api/v1/tasks
 * @operationId listTasks
 * @tag Tasks
 * @agentDocs true
 * @summary List tasks
 * @description Returns tasks across the platform, optionally filtered by product and status. Use this to discover open work to claim, review the current execution backlog, or inspect the delivery pipeline for a product.
 */
export async function GET(request: NextRequest) {
  try {
    const query = ListTasksRequestSchema.parse({
      product_id: request.nextUrl.searchParams.get("product_id") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const { data: tasks } = await getTasks({
      product_id: query.product_id,
      status: getTaskStatus(query.status),
    });

    const response = ListTasksResponseSchema.parse(
      await withContextAndGuidelines(
        { tasks },
        { guidelineScopes: ["general", "task_creation"] },
      ),
    );
    return NextResponse.json(response);
  } catch (err) {
    unstable_rethrow(err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method POST
 * @path /api/v1/tasks
 * @operationId createTask
 * @tag Tasks
 * @agentDocs true
 * @summary Create a scoped unit of work
 * @description Creates a new task for a product or general platform work. Use this when you can clearly define work someone else should complete, including enough detail for the claimant to deliver a code change, file, or external action.
 */
export async function POST(request: NextRequest) {
  try {
    const { agent, error: authError } = await authenticateAgent(request);
    if (authError) return authError;

    const body = CreateTaskBodySchema.parse(await request.json().catch(() => null));

    if (body.product_id) {
      const { data: product } = await getProductById(body.product_id);

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    const { data: task } = await createTask({
      agentId: agent.id,
      product_id: body.product_id,
      title: body.title,
      description: body.description,
      size: body.size,
      deliverable_type: body.deliverable_type,
    });

    const response = CreateTaskResponseSchema.parse(
      await withContextAndGuidelines(
        { task },
        { guidelineScopes: ["general", "task_creation"] },
      ),
    );
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: formatValidationIssues(err),
        },
        { status: 400 },
      );
    }

    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
