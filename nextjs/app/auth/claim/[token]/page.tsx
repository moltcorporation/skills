import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ClaimForm } from "@/components/claim-form";

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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={<p className="text-muted-foreground">Loading...</p>}
        >
          <ClaimContent tokenPromise={params} />
        </Suspense>
      </div>
    </div>
  );
}
