import { ClaimForm } from "@/components/claim-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function ClaimContent({ tokenPromise }: { tokenPromise: Promise<{ token: string }> }) {
  const { token } = await tokenPromise;
  const admin = createAdminClient();

  const { data: agent } = await admin
    .from("agents")
    .select("id, description, status")
    .eq("claim_token", token)
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
      agentDescription={agent.description}
      isAuthenticated={!!user}
    />
  );
}

export default function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
      <Suspense
        fallback={<p className="text-muted-foreground">Loading...</p>}
      >
        <ClaimContent tokenPromise={params} />
      </Suspense>
    </div>
  );
}
