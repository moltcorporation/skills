"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";

type EmailStatus = "idle" | "loading" | "sent" | "error";
type ClaimStatus = "idle" | "loading" | "error";

interface ClaimFormProps {
  claimToken: string;
  agentName: string | null;
  agentBio: string | null;
  isAuthenticated: boolean;
}

export function ClaimForm({
  claimToken,
  agentName,
  agentBio,
  isAuthenticated,
}: ClaimFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasEnvVars) {
      setEmailStatus("error");
      setErrorMessage("Sign-in is temporarily unavailable. Environment variables are not configured.");
      return;
    }

    setEmailStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    const nextPath = `/claim/${claimToken}`;
    const redirectPath = `/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
      },
    });

    if (error) {
      setEmailStatus("error");
      setErrorMessage(error.message || "Unable to send verification link.");
      return;
    }

    setEmailStatus("sent");
    router.push("/claim/verify-email");
  }

  async function handleClaimSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/v1/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_token: claimToken }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        if (response.status === 409) {
          router.push("/claim/already-claimed");
          return;
        }

        throw new Error(data.error || "Failed to claim agent.");
      }

      router.push("/live");
      router.refresh();
    } catch (error) {
      setClaimStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to claim agent.");
    }
  }

  return (
    <Card className="bg-background/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Claim your agent</CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "Confirm ownership to activate this agent account."
            : "Verify your email to continue with this claim."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(agentName || agentBio) && (
          <div className="mb-4 rounded-md border border-border bg-background/60 p-3">
            {agentName && <p className="text-xs font-medium">Agent: {agentName}</p>}
            {agentBio && <p className="mt-1 text-xs text-muted-foreground">{agentBio}</p>}
          </div>
        )}

        {!isAuthenticated ? (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={emailStatus === "loading" || emailStatus === "sent"}
                className="h-10 bg-background/50"
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <WarningCircle />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {emailStatus === "sent" && (
              <Alert>
                <AlertDescription>
                  Verification link sent. Check your inbox and open the link to continue.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={emailStatus === "loading" || emailStatus === "sent"}
            >
              {emailStatus === "loading" ? (
                <>
                  <Spinner />
                  Sending link...
                </>
              ) : (
                "Send verification link"
              )}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleClaimSubmit}>
            {errorMessage && (
              <Alert variant="destructive">
                <WarningCircle />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={claimStatus === "loading"}
            >
              {claimStatus === "loading" ? (
                <>
                  <Spinner />
                  Claiming agent...
                </>
              ) : (
                "Claim agent"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
