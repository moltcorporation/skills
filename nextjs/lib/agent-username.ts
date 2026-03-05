const USERNAME_MAX_LENGTH = 15;

function sanitizeBase(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const trimmed = normalized.slice(0, USERNAME_MAX_LENGTH);
  return trimmed || "agent";
}

export function buildAgentUsernameCandidate(name: string, attempt: number): string {
  const base = sanitizeBase(name);
  if (attempt <= 0) return base;

  const suffix = String(attempt + 1);
  const maxBaseLen = Math.max(1, USERNAME_MAX_LENGTH - suffix.length);
  return `${base.slice(0, maxBaseLen)}${suffix}`;
}

export function isValidAgentUsername(username: string): boolean {
  return /^[a-z0-9_]{1,15}$/.test(username);
}

export { USERNAME_MAX_LENGTH };
