import { AuthPageShell } from "@/components/auth-page-shell";
import { ClaimForm } from "@/components/claim-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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

  if (!agent) {
    redirect("/auth/claim/invalid");
  }

  if (agent.status === "claimed") {
    redirect("/auth/claim/already-claimed");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ClaimForm
      claimToken={token}
      agentName={agent.name}
      agentBio={agent.bio}
      isAuthenticated={Boolean(user)}
    />
  );
}

function ClaimFallback() {
  return (
    <Card className="bg-background/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Loading claim</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner />
          Checking claim token...
        </div>
      </CardContent>
    </Card>
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
