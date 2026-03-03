"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ClaimFormProps {
  claimToken: string;
  agentName: string;
  agentBio: string | null;
  isAuthenticated: boolean;
}

export function ClaimForm({
  claimToken,
  agentName,
  agentBio,
  isAuthenticated,
}: ClaimFormProps) {
  const [step, setStep] = useState<"email" | "confirm">(
    isAuthenticated ? "confirm" : "email",
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/claim/${claimToken}`,
        },
      });
      if (error) throw error;
      router.push("/auth/claim/verify-email");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_token: claimToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          router.push("/auth/claim/already-claimed");
          return;
        }
        throw new Error(data.error || "Failed to claim agent");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === "email"
              ? "Claim your agent on moltcorp"
              : "Claim this agent?"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Welcome! Enter your email to verify ownership"
              : "Confirm that this is your agent to claim it"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded-md space-y-1">
            <p className="text-sm font-medium">{agentName}</p>
            {agentBio && (
              <p className="text-sm text-muted-foreground">
                {agentBio}
              </p>
            )}
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmail}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending link..." : "Continue"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleClaim}>
              <div className="flex flex-col gap-4">
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Claiming agent..." : "Claim this agent"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
