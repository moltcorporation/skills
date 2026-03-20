import { Vercel } from "@vercel/sdk";
import crypto from "crypto";

const VERCEL_TEAM_ID = "team_96lZge1MbF3eGSApicbowsHp";

function getVercelClient() {
  return new Vercel({ bearerToken: process.env.VERCEL_TOKEN! });
}

export async function createVercelProject(
  repoName: string,
  envVars?: Record<string, string>,
): Promise<{ projectId: string; vercelUrl: string }> {
  const vercel = getVercelClient();

  const project = await vercel.projects.createProject({
    teamId: VERCEL_TEAM_ID,
    requestBody: {
      name: repoName,
      gitRepository: {
        repo: `moltcorporation/${repoName}`,
        type: "github",
      },
      previewDeploymentsDisabled: true,
      ssoProtection: null,
      environmentVariables: envVars
        ? Object.entries(envVars).map(([key, value]) => ({
          key,
          value,
          target: ["production" as const, "preview" as const, "development" as const],
          type: "encrypted" as const,
        }))
        : undefined,
    },
  });

  // Trigger initial deployment from the main branch
  const deployment = await vercel.deployments.createDeployment({
    teamId: VERCEL_TEAM_ID,
    skipAutoDetectionConfirmation: "1",
    requestBody: {
      name: repoName,
      project: project.id,
      target: "production",
      gitSource: {
        org: "moltcorporation",
        repo: repoName,
        ref: "main",
        type: "github",
      },
    },
  });

  // Use the production alias assigned by Vercel, fall back to deployment URL
  const assignedHost = deployment.alias?.[0] ?? deployment.url;
  const vercelUrl = assignedHost.startsWith("https://")
    ? assignedHost
    : `https://${assignedHost}`;

  return {
    projectId: project.id,
    vercelUrl,
  };
}

export async function deleteVercelProject(projectName: string): Promise<void> {
  const vercel = getVercelClient();

  await vercel.projects.deleteProject({
    idOrName: projectName,
    teamId: VERCEL_TEAM_ID,
  });
}

// ======================================================
// Deployment error details
// ======================================================

export type DeploymentErrorDetails = {
  errorMessage: string | null;
  logSnippet: string | null;
  deploymentUrl: string | null;
  commitSha: string | null;
};

export async function getDeploymentError(
  deploymentId: string,
): Promise<DeploymentErrorDetails> {
  const vercel = getVercelClient();

  const [deployment, events] = await Promise.all([
    vercel.deployments
      .getDeployment({ idOrUrl: deploymentId, teamId: VERCEL_TEAM_ID })
      .catch(() => null),
    vercel.deployments
      .getDeploymentEvents({ idOrUrl: deploymentId, teamId: VERCEL_TEAM_ID, limit: -1 })
      .catch(() => []),
  ]);

  // Extract error lines from build logs
  const errorLines = (events as Array<{ text?: string; type?: string }>)
    .filter((e) => e.type === "error" || e.type === "stderr")
    .map((e) => e.text ?? "")
    .filter(Boolean);

  const logSnippet = errorLines.length > 0
    ? errorLines.slice(-20).join("\n")
    : null;

  const deploymentUrl = deployment?.url
    ? `https://${deployment.url}`
    : null;

  return {
    errorMessage: (deployment as Record<string, unknown>)?.errorMessage as string | null ?? null,
    logSnippet,
    deploymentUrl,
    commitSha: (deployment?.meta as Record<string, string> | undefined)?.githubCommitSha ?? null,
  };
}

// ======================================================
// Webhook signature verification
// ======================================================

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) throw new Error("VERCEL_WEBHOOK_SECRET is not set");

  const expected = crypto
    .createHmac("sha1", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

// ======================================================
// Webhook creation (one-time setup utility)
// ======================================================

export async function createVercelWebhook(
  url: string,
  events: Array<"deployment.error" | "deployment.ready" | "deployment.succeeded">,
): Promise<{ id: string; secret: string }> {
  const vercel = getVercelClient();

  const result = await vercel.webhooks.createWebhook({
    teamId: VERCEL_TEAM_ID,
    requestBody: {
      url,
      events,
    },
  });

  return {
    id: result.id,
    secret: result.secret,
  };
}
