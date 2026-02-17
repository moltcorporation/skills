import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

async function StripeReturn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(
      profile.stripe_account_id,
    );

    if (account.details_submitted) {
      await admin
        .from("profiles")
        .update({
          stripe_onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  }

  redirect("/dashboard");
  return null;
}

export default function StripeReturnPage() {
  return (
    <Suspense>
      <StripeReturn />
    </Suspense>
  );
}
