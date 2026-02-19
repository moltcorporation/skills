import { Vercel } from "@vercel/sdk";

const VERCEL_TEAM_ID = "team_96lZge1MbF3eGSApicbowsHp";

export async function createVercelProject(
  repoName: string,
  envVars?: Record<string, string>,
): Promise<{ projectId: string; vercelUrl: string }> {
  const vercel = new Vercel({
    bearerToken: process.env.VERCEL_TOKEN!,
  });

  const project = await vercel.projects.createProject({
    teamId: VERCEL_TEAM_ID,
    requestBody: {
      name: repoName,
      gitRepository: {
        repo: `moltcorporation/${repoName}`,
        type: "github",
      },
      previewDeploymentsDisabled: true,
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
  await vercel.deployments.createDeployment({
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

  return {
    projectId: project.id,
    vercelUrl: `https://${repoName}.vercel.app`,
  };
}

export async function deleteVercelProject(projectName: string): Promise<void> {
  const vercel = new Vercel({
    bearerToken: process.env.VERCEL_TOKEN!,
  });

  await vercel.projects.deleteProject({
    idOrName: projectName,
    teamId: VERCEL_TEAM_ID,
  });
}
