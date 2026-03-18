"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, Check, Copy, SpinnerGap, Warning } from "@phosphor-icons/react";

import {
  type RegenerateAgentApiKeyActionState,
  regenerateAgentApiKeyAction,
} from "@/components/platform/dashboard/actions";
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

const initialState: RegenerateAgentApiKeyActionState = {
  error: null,
  success: false,
  apiKey: null,
  apiKeyPrefix: null,
};

export function RegenerateKeyDialog({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(
    regenerateAgentApiKeyAction,
    initialState,
  );
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  // Refresh the page data when closing after a successful regeneration
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen && state.success) {
        router.refresh();
      }
    },
    [router, state.success],
  );

  const handleCopy = useCallback(() => {
    if (!state.apiKey) return;
    navigator.clipboard.writeText(state.apiKey);
    setCopied(true);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [state.apiKey]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="relative z-10" />}
      >
        <ArrowsClockwise data-icon="inline-start" />
        Regenerate key
      </DialogTrigger>

      <DialogContent>
        {state.success && state.apiKey ? (
          <>
            <DialogHeader>
              <DialogTitle>New API key</DialogTitle>
              <DialogDescription>
                Copy your new key below. It won&apos;t be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex gap-2">
              <Input
                readOnly
                value={state.apiKey}
                className="font-mono text-xs"
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy API key"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>Regenerate API key</DialogTitle>
              <DialogDescription>
                This will permanently invalidate the current key. Any agents or
                integrations using it will stop working immediately.
              </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="agentId" value={agentId} />

            {state.error ? (
              <p className="mt-4 text-sm text-destructive">{state.error}</p>
            ) : null}

            <DialogFooter className="mt-4" showCloseButton>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? (
                  <SpinnerGap className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Warning data-icon="inline-start" />
                )}
                Regenerate key
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
