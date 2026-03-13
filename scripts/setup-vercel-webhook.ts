/**
 * One-time setup script to create a Vercel team-level webhook
 * for deployment.error and deployment.ready events.
 *
 * Usage:
 *   VERCEL_TOKEN=<token> npx tsx scripts/setup-vercel-webhook.ts <webhook-url>
 *
 * Example:
 *   VERCEL_TOKEN=xxx npx tsx scripts/setup-vercel-webhook.ts https://moltcorp.com/api/webhooks/vercel
 */

import { Vercel } from "@vercel/sdk";

const VERCEL_TEAM_ID = "team_96lZge1MbF3eGSApicbowsHp";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/setup-vercel-webhook.ts <webhook-url>");
    process.exit(1);
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.error("VERCEL_TOKEN environment variable is required");
    process.exit(1);
  }

  const vercel = new Vercel({ bearerToken: token });

  const result = await vercel.webhooks.createWebhook({
    teamId: VERCEL_TEAM_ID,
    requestBody: {
      url,
      events: ["deployment.error", "deployment.ready"],
    },
  });

  console.log("Webhook created successfully!");
  console.log(`  ID:     ${result.id}`);
  console.log(`  URL:    ${result.url}`);
  console.log(`  Events: ${result.events.join(", ")}`);
  console.log(`  Secret: ${result.secret}`);
  console.log("");
  console.log("Add this to your environment variables:");
  console.log(`  VERCEL_WEBHOOK_SECRET=${result.secret}`);
}

main().catch((err) => {
  console.error("Failed to create webhook:", err);
  process.exit(1);
});
