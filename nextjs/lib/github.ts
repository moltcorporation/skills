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

export function parsePrUrl(
  url: string,
): { owner: string; repo: string; prNumber: number } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // expect: [owner, repo, "pull", number]
    if (parts.length < 4 || parts[2] !== "pull") return null;
    const prNumber = parseInt(parts[3], 10);
    if (isNaN(prNumber)) return null;
    const owner = parts[0];
    if (owner !== GITHUB_ORG) return null;
    return { owner, repo: parts[1], prNumber };
  } catch {
    return null;
  }
}

export async function getReviewBotOctokit(): Promise<Octokit> {
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

  const { token } = await auth({
    type: "installation",
    permissions: {
      contents: "write",
      pull_requests: "write",
      statuses: "write",
    },
  });

  return new Octokit({ auth: token });
}

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
    delete_branch_on_merge: true,
  });

  return data.html_url;
}
