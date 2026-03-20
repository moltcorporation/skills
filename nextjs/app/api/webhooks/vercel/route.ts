import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, getDeploymentError } from "@/lib/vercel";
import { insertIntegrationEvent } from "@/lib/data/integration-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { slackLog } from "@/lib/slack";

type VercelWebhookPayload = {
  id: string;
  type: string;
  createdAt: number;
  payload: {
    deployment: {
      id: string;
      name: string;
      url: string;
      meta?: Record<string, string>;
    };
    project?: {
      id: string;
    };
    links?: {
      deployment?: string;
      project?: string;
    };
  };
};

async function lookupProductByProjectId(
  vercelProjectId: string,
): Promise<{ id: string; name: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name")
    .eq("vercel_project_id", vercelProjectId)
    .maybeSingle();
  return data;
}

// POST /api/webhooks/vercel — Handle Vercel deployment webhook events
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-vercel-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-vercel-signature header" },
      { status: 400 },
    );
  }

  try {
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("[vercel.webhooks] signature verification:", err);
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 500 },
    );
  }

  let event: VercelWebhookPayload;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projectId = event.payload.project?.id;
  const deploymentId = event.payload.deployment.id;
  const deploymentName = event.payload.deployment.name;

  // Look up the product associated with this Vercel project — ignore events
  // for projects that aren't tracked as products (e.g. the platform itself)
  const product = projectId
    ? await lookupProductByProjectId(projectId)
    : null;

  if (!product) {
    return NextResponse.json({ received: true });
  }

  try {
    if (event.type === "deployment.error") {
      const errorDetails = await getDeploymentError(deploymentId);

      await insertIntegrationEvent({
        productId: product.id,
        source: "vercel",
        eventType: "deployment.error",
        payload: {
          deploymentId,
          projectId,
          deploymentName,
          errorMessage: errorDetails.errorMessage,
          logSnippet: errorDetails.logSnippet,
          deploymentUrl: errorDetails.deploymentUrl,
          commitSha: errorDetails.commitSha,
        },
      });

      await slackLog(
        `🔴 Deployment failed: *${product.name}* — ${errorDetails.errorMessage ?? "unknown error"}`,
      );
    } else if (event.type === "deployment.succeeded" || event.type === "deployment.ready") {
      const deploymentUrl = event.payload.deployment.url
        ? `https://${event.payload.deployment.url}`
        : null;
      const commitSha = event.payload.deployment.meta?.githubCommitSha ?? null;

      await insertIntegrationEvent({
        productId: product.id,
        source: "vercel",
        eventType: "deployment.ready",
        payload: {
          deploymentId,
          projectId,
          deploymentName,
          deploymentUrl,
          commitSha,
        },
      });

      await slackLog(
        `🟢 Deployment ready: *${product.name}*${deploymentUrl ? ` — ${deploymentUrl}` : ""}`,
      );
    }
  } catch (err) {
    console.error("[vercel.webhooks]", err);
    return NextResponse.json(
      { error: "Internal error processing webhook" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
