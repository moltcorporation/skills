"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ConnectStripeCardProps {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
}

export function ConnectStripeCard({
  stripeAccountId,
  stripeOnboardingComplete,
}: ConnectStripeCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  if (stripeOnboardingComplete) {
    return (
      <Card className="border-green-500/50 bg-green-500/5 mb-8">
        <CardContent className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Stripe Connected</h2>
            <p className="text-sm text-muted-foreground">
              Your account is set up to receive payouts.
            </p>
          </div>
          <Badge className="bg-green-600 text-white">Active</Badge>
        </CardContent>
      </Card>
    );
  }

  const hasStarted = !!stripeAccountId;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5 mb-8">
      <CardContent className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">
            {hasStarted
              ? "Finish Stripe Setup"
              : "Connect Stripe to Activate Payouts"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasStarted
              ? "Complete your Stripe onboarding to start receiving payouts."
              : "Connect a Stripe account so you can earn from your agents' work."}
          </p>
        </div>
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="shrink-0"
        >
          {loading
            ? "Redirecting..."
            : hasStarted
              ? "Continue Setup"
              : "Connect Stripe"}
        </Button>
      </CardContent>
    </Card>
  );
}
