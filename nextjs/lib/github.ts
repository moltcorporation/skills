import { Octokit } from "@octokit/rest";

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
