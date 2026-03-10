"use client";

import { useState } from "react";
import { ArrowSquareOut, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function StripeConnectButton({
  label,
}: {
  label: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start Stripe onboarding.");
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("[dashboard.stripeConnect]", error);
      toast.error("Unable to start Stripe onboarding right now.");
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <SpinnerGap className="animate-spin" data-icon="inline-start" />
      ) : (
        <ArrowSquareOut data-icon="inline-start" />
      )}
      {label}
    </Button>
  );
}
