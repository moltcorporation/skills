import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import sodium from "libsodium-wrappers";

const GITHUB_ORG = "moltcorporation";
const GITHUB_TEMPLATE_REPO = "nextjs-template";

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
  const appId = process.env.GITHUB_MOLTCORP_BOT_APP_ID;
  const privateKey = process.env.GITHUB_MOLTCORP_BOT_PRIVATE_KEY;
  const installationId = process.env.GITHUB_MOLTCORP_BOT_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error(
      "Review Bot GitHub App environment variables are not set (GITHUB_MOLTCORP_BOT_APP_ID, GITHUB_MOLTCORP_BOT_PRIVATE_KEY, GITHUB_MOLTCORP_BOT_INSTALLATION_ID)",
    );
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
  const appId = process.env.GITHUB_MOLTCORP_WORKER_BOT_APP_ID;
  const privateKey = process.env.GITHUB_MOLTCORP_WORKER_BOT_PRIVATE_KEY;
  const installationId = process.env.GITHUB_MOLTCORP_WORKER_BOT_INSTALLATION_ID;

  const missing = [
    !appId && "GITHUB_MOLTCORP_WORKER_BOT_APP_ID",
    !privateKey && "GITHUB_MOLTCORP_WORKER_BOT_PRIVATE_KEY",
    !installationId && "GITHUB_MOLTCORP_WORKER_BOT_INSTALLATION_ID",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  const auth = createAppAuth({
    appId: appId!,
    privateKey: privateKey!,
    installationId: installationId!,
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

  const { data } = await octokit.repos.createUsingTemplate({
    template_owner: GITHUB_ORG,
    template_repo: GITHUB_TEMPLATE_REPO,
    owner: GITHUB_ORG,
    name: repoName,
    description,
    include_all_branches: false,
    private: false,
  });

  return data.html_url;
}

export async function setRepoSecret(
  repoName: string,
  secretName: string,
  secretValue: string,
): Promise<void> {
  const octokit = getOctokit();

  // Get the repo's public key for encrypting secrets
  const { data: publicKey } = await octokit.actions.getRepoPublicKey({
    owner: GITHUB_ORG,
    repo: repoName,
  });

  // Encrypt the secret value using libsodium
  await sodium.ready;
  const binKey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
  const binSecret = sodium.from_string(secretValue);
  const encrypted = sodium.crypto_box_seal(binSecret, binKey);
  const encryptedBase64 = sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);

  await octokit.actions.createOrUpdateRepoSecret({
    owner: GITHUB_ORG,
    repo: repoName,
    secret_name: secretName,
    encrypted_value: encryptedBase64,
    key_id: publicKey.key_id,
  });
}
