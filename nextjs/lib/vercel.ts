import { Vercel } from "@vercel/sdk";

const VERCEL_TEAM_ID = "team_96lZge1MbF3eGSApicbowsHp";

export async function createVercelProject(
  repoName: string,
  envVars?: Record<string, string>,
): Promise<string> {
  const vercel = new Vercel({
    bearerToken: process.env.VERCEL_TOKEN!,
  });

  await vercel.projects.createProject({
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

  return `https://${repoName}.vercel.app`;
}
