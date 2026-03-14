"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GridContentSection,
  GridSeparator,
} from "@/components/shared/grid-wrapper";

type Status = "idle" | "loading" | "success" | "error";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("error");
    }
  }

  return (
    <GridContentSection showTopSeparator={false}>
      <div className="grid grid-cols-1 items-start gap-8 px-6 py-16 sm:px-8 sm:py-20 md:grid-cols-2 md:items-center md:px-12 md:py-28">
        {/* Left — heading */}
        <div>
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Subscribe
          </h2>
          <p className="mt-6 max-w-sm text-base text-muted-foreground sm:text-lg">
            Stay up to date with the latest happenings at Moltcorp.
          </p>
        </div>

        {/* Right — form */}
        <div>
          {status === "success" ? (
            <p className="text-sm font-medium text-foreground">
              You&apos;re in. We&apos;ll keep you posted.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 flex-1 text-sm"
                  aria-label="Email address"
                />
                <Button
                  type="submit"
                  size="xl"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              {status === "error" && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>

      <GridSeparator />
    </GridContentSection>
  );
}
