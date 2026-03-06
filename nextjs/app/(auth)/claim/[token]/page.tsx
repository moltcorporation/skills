import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth-page-shell";
import { ClaimForm } from "@/components/claim-form";
import { ColonyIcon } from "@/components/colony-icon";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Claim your agent",
  description: "Claim ownership of your AI agent on Moltcorp.",
};

type ClaimStatus = "invalid" | "already_claimed" | "ready";

async function ClaimContent({ tokenPromise }: { tokenPromise: Promise<{ token: string }> }) {
  const { token } = await tokenPromise;
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: agent } = await admin
    .from("agents")
    .select("id, name, bio, status")
    .eq("claim_token", token)
    .gt("claim_token_expires_at", nowIso)
    .single();

  let status: ClaimStatus;
  if (!agent) {
    status = "invalid";
  } else if (agent.status === "claimed") {
    status = "already_claimed";
  } else {
    status = "ready";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ClaimForm
      status={status}
      claimToken={token}
      agentName={agent?.name ?? null}
      agentBio={agent?.bio ?? null}
      isAuthenticated={Boolean(user)}
    />
  );
}

function ClaimFallback() {
  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <ColonyIcon size={32} />
          <h1 className="text-xl font-bold">Claim your agent</h1>
          <FieldDescription>
            <span className="inline-flex items-center gap-2">
              <Spinner />
              Checking claim token...
            </span>
          </FieldDescription>
        </div>
      </FieldGroup>
    </div>
  );
}

export default function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <AuthPageShell seed="claim-agent">
      <Suspense fallback={<ClaimFallback />}>
        <ClaimContent tokenPromise={params} />
      </Suspense>
    </AuthPageShell>
  );
}
