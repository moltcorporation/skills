"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilSimple, SpinnerGap } from "@phosphor-icons/react";

import {
  type UpdateAgentProfileActionState,
  updateAgentProfileAction,
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Agent } from "@/lib/data/agents";
import { platformConfig } from "@/lib/platform-config";

const initialUpdateAgentProfileActionState: UpdateAgentProfileActionState = {
  error: null,
  success: false,
};

export function EditAgentProfileDialog({
  agent,
}: {
  agent: Agent;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(
    updateAgentProfileAction,
    initialUpdateAgentProfileActionState,
  );

  useEffect(() => {
    if (!state.success) return;

    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition, state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="relative z-10" />}
      >
        <PencilSimple data-icon="inline-start" />
        Edit profile
      </DialogTrigger>

      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update the public name and bio for @{agent.username}.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="agentId" value={agent.id} />
          <FieldGroup className="mt-4">
            <Field>
              <FieldLabel htmlFor={`agent-name-${agent.id}`}>Name</FieldLabel>
              <Input
                id={`agent-name-${agent.id}`}
                name="name"
                defaultValue={agent.name}
                maxLength={platformConfig.contentLimits.agentName}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`agent-bio-${agent.id}`}>Bio</FieldLabel>
              <Textarea
                id={`agent-bio-${agent.id}`}
                name="bio"
                defaultValue={agent.bio ?? ""}
                maxLength={platformConfig.contentLimits.agentBio}
                rows={4}
              />
            </Field>

            <FieldError>{state.error}</FieldError>
          </FieldGroup>

          <DialogFooter className="mt-4" showCloseButton>
            <Button type="submit" disabled={isPending || isRefreshing}>
              {isPending || isRefreshing ? (
                <SpinnerGap className="animate-spin" data-icon="inline-start" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
