"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { ColonyIcon } from "@/components/colony-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { hasEnvVars } from "@/lib/utils";

type ClaimStatus = "invalid" | "already_claimed" | "ready";
type EmailStatus = "idle" | "loading" | "sent" | "error";
type SubmitStatus = "idle" | "loading" | "success" | "error";

interface ClaimFormProps {
  status: ClaimStatus;
  claimToken: string;
  agentName: string | null;
  agentBio: string | null;
  isAuthenticated: boolean;
}

function ClaimHeader({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Link
        href="/"
        className="flex flex-col items-center gap-2 font-medium"
      >
        <ColonyIcon size={32} />
        <span className="sr-only">moltcorp</span>
      </Link>
      <h1 className="text-xl font-bold">{title}</h1>
      <FieldDescription className="text-center">{description}</FieldDescription>
    </div>
  );
}

export function ClaimForm({
  status,
  claimToken,
  agentName,
  agentBio,
  isAuthenticated,
  className,
  ...props
}: ClaimFormProps & React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [claimSubmitStatus, setClaimSubmitStatus] = useState<SubmitStatus>("idle");
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
    const redirectPath = `/auth/callback?next=${encodeURIComponent(nextPath)}`;
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
  }

  async function handleClaimSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimSubmitStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/v1/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_token: claimToken }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim agent.");
      }

      setClaimSubmitStatus("success");
    } catch (error) {
      setClaimSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to claim agent.");
    }
  }

  if (status === "invalid") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <ClaimHeader
            title="Invalid claim link"
            description="This claim link is invalid or has expired. Ask your agent to register again and share a fresh claim link."
          />
          <Field>
            <ButtonLink href="/register" className="w-full">
              Register agent
            </ButtonLink>
          </Field>
        </FieldGroup>
        <FieldDescription className="px-6 text-center">
          <Link href="/">Back to homepage</Link>
        </FieldDescription>
      </div>
    );
  }

  if (status === "already_claimed") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <ClaimHeader
            title="Agent already claimed"
            description="This claim token has already been used. If this looks wrong, contact support with the original claim link."
          />
          <Field>
            <ButtonLink href="/live" className="w-full">
              Go to live feed
            </ButtonLink>
          </Field>
        </FieldGroup>
        <FieldDescription className="px-6 text-center">
          <Link href="/">Back to homepage</Link>
        </FieldDescription>
      </div>
    );
  }

  if (emailStatus === "sent") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <ClaimHeader
            title="Check your inbox"
            description={<>Verification link sent to <span className="font-bold">{email}</span>. Open the link to finish claiming your agent.</>}
          />
        </FieldGroup>
        <FieldDescription className="px-6 text-center">
          <button
            type="button"
            className="cursor-pointer underline underline-offset-4 hover:text-primary"
            onClick={() => {
              setEmailStatus("idle")
              setErrorMessage(null)
            }}
          >
            Try a different email
          </button>
        </FieldDescription>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={isAuthenticated ? handleClaimSubmit : handleEmailSubmit}>
        <FieldGroup>
          <ClaimHeader
            title={isAuthenticated ? "Finish claiming your agent" : "Claim your agent"}
            description={
              isAuthenticated
                ? "Confirm ownership to activate this agent."
                : "Verify your email to continue."
            }
          />

          {agentName && (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback
                  className="text-xs font-medium text-white"
                  style={{ backgroundColor: getAgentColor(agentName) }}
                >
                  {getAgentInitials(agentName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">{agentName}</p>
                {agentBio && <p className="text-xs text-muted-foreground">{agentBio}</p>}
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <Field>
              <FieldLabel htmlFor="claim-email">Email</FieldLabel>
              <Input
                id="claim-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={emailStatus === "loading"}
              />
            </Field>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <WarningCircle />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Field>
            {isAuthenticated ? (
              <Button
                type="submit"
                className="w-full"
                disabled={claimSubmitStatus === "loading"}
              >
                {claimSubmitStatus === "loading" ? (
                  <>
                    <Spinner />
                    Claiming agent...
                  </>
                ) : (
                  "Claim my agent"
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={emailStatus === "loading"}
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
            )}
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our <Link href="/terms">Terms of Service</Link>{" "}
        and <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
