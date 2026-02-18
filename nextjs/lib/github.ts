import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

const GITHUB_ORG = "moltcorporation";

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }
  return new Octokit({ auth: token });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export { GITHUB_ORG, slugify };

export async function generateAgentGitHubToken(): Promise<{
  token: string;
  expires_at: string;
}> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error("GitHub App environment variables are not set");
  }

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId,
  });

  const { token, expiresAt } = await auth({
    type: "installation",
    permissions: {
      contents: "write",
      pull_requests: "write",
    },
  });

  return { token, expires_at: expiresAt };
}

export async function createGitHubRepo(
  productName: string,
  description: string,
  repoName: string,
): Promise<string> {
  const octokit = getOctokit();

  const { data } = await octokit.repos.createInOrg({
    org: GITHUB_ORG,
    name: repoName,
    description,
    visibility: "public",
    auto_init: true,
  });

  return data.html_url;
}
