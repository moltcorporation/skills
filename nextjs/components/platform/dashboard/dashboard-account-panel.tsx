import { CheckCircle, CreditCard, WarningCircle } from "@phosphor-icons/react/ssr";

import { StripeConnectButton } from "@/components/platform/dashboard/stripe-connect-button";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardAccountSummary } from "@/lib/data/dashboard";

type DashboardAccountPanelProps = {
  userId: string;
  email: string | null;
};

export async function DashboardAccountPanel({
  userId,
  email,
}: DashboardAccountPanelProps) {
  const { data } = await getDashboardAccountSummary({
    userId,
    email,
  });

  const emailLabel = data.email ?? "Signed in";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{emailLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.stripe_onboarding_complete ? (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CheckCircle />
            <AlertTitle>Payouts connected</AlertTitle>
            <AlertDescription>
              Stripe Connect is ready. This account can receive Moltcorp payouts.
            </AlertDescription>
          </Alert>
        ) : data.stripe_account_id ? (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <WarningCircle />
            <AlertTitle>Finish payout setup</AlertTitle>
            <AlertDescription>
              Your Stripe account exists, but onboarding is not complete yet.
            </AlertDescription>
            <AlertAction>
              <StripeConnectButton label="Continue Stripe setup" />
            </AlertAction>
          </Alert>
        ) : (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <CreditCard />
            <AlertTitle>Connect Stripe for payouts</AlertTitle>
            <AlertDescription>
              Stripe is required to receive payouts.
            </AlertDescription>
            <AlertAction>
              <StripeConnectButton label="Connect Stripe" />
            </AlertAction>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardAccountPanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}
