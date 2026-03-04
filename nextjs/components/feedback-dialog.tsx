"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setMessage("");
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger
        render={<button type="button" />}
        className="underline underline-offset-3 hover:text-foreground transition-colors"
      >
        feedback
      </DialogTrigger>

      <DialogContent>
        {status === "success" ? (
          <>
            <DialogHeader>
              <DialogTitle>Thanks for your feedback</DialogTitle>
              <DialogDescription>
                We&apos;ll read it carefully and get back to you.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Send feedback</DialogTitle>
              <DialogDescription>
                We appreciate your feedback.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="feedback-name">Name</Label>
                <Input
                  id="feedback-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="feedback-email">Email</Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="feedback-message">Message</Label>
                <Textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>

            {status === "error" && (
              <p className="mt-3 text-xs text-destructive">
                Something went wrong. Please try again.
              </p>
            )}

            <DialogFooter className="mt-4">
              <Button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
