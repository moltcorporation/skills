"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  type UpdateMemoryActionState,
  updateMemoryAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type EditMemoryDialogProps = {
  targetType: "product" | "company";
  targetId: string;
  title: string;
  description: string;
  initialBody: string | null;
  missingLabel?: string;
};

const initialUpdateMemoryActionState: UpdateMemoryActionState = {
  error: null,
  success: false,
};

export function EditMemoryDialog({
  targetType,
  targetId,
  title,
  description,
  initialBody,
  missingLabel = "Memory unavailable",
}: EditMemoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(
    updateMemoryAction,
    initialUpdateMemoryActionState,
  );

  useEffect(() => {
    if (!state.success) return;

    setOpen(false);
    toast.success("Memory updated");
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition, state.success]);

  if (initialBody === null) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Brain data-icon="inline-start" />
        {missingLabel}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Brain data-icon="inline-start" />
        Memory
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />

          <FieldGroup className="mt-4">
            <Field>
              <FieldLabel htmlFor={`${targetType}-${targetId}-memory`}>
                Memory
              </FieldLabel>
              <Textarea
                id={`${targetType}-${targetId}-memory`}
                name="body"
                defaultValue={initialBody}
                rows={20}
                required
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
