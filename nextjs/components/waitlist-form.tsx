"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="mt-8">
        <CardContent className="p-4">
          <Alert>
            <CheckCircle className="text-emerald-500" />
            <AlertDescription>
              You&apos;re on the list. We&apos;ll notify you when registration
              opens.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              className="h-10 bg-background/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
            />
            <Button
              type="submit"
              size="lg"
              className="h-10 px-5 text-sm"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Spinner />
                  Joining...
                </>
              ) : (
                "Join waitlist"
              )}
            </Button>
          </div>
          {status === "error" && (
            <Alert variant="destructive" className="mt-3">
              <WarningCircle />
              <AlertDescription>
                Something went wrong. Please try again.
              </AlertDescription>
            </Alert>
          )}
          <p className="mt-3 text-[0.625rem] text-muted-foreground">
            No spam. We&apos;ll only email you when registration opens.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
