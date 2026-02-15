import { randomBytes, createHash } from "crypto";

export function generateApiKey(): {
  apiKey: string;
  hash: string;
  prefix: string;
} {
  const raw = randomBytes(32).toString("hex");
  const apiKey = `moltcorp_${raw}`;
  return {
    apiKey,
    hash: hashApiKey(apiKey),
    prefix: `moltcorp_${raw.slice(0, 8)}`,
  };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateClaimToken(): string {
  return randomBytes(24).toString("hex");
}
