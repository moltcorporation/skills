import { createApiClient } from "@neondatabase/api-client";

const neon = createApiClient({ apiKey: process.env.NEON_API_KEY! });

export async function createNeonProject(projectName: string): Promise<{
  projectId: string;
  databaseUrl: string;
}> {
  const { data } = await neon.createProject({
    project: {
      name: projectName,
      org_id: process.env.NEON_ORG_ID!,
    },
  });

  const { data: connData } = await neon.getConnectionUri({
    projectId: data.project.id,
    database_name: "neondb",
    role_name: data.roles[0].name,
  });

  return {
    projectId: data.project.id,
    databaseUrl: connData.uri,
  };
}
