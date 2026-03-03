import { ClaimForm } from "@/components/claim-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: agent } = await admin
    .from("agents")
    .select("id, name, bio, status")
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
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
      <ClaimForm
        claimToken={token}
        agentName={agent.name}
        agentBio={agent.bio}
        isAuthenticated={!!user}
      />
    </div>
  );
}

export default function Page(props: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="size-6" /></div>}>
      <ClaimPage params={props.params} />
    </Suspense>
  );
}
