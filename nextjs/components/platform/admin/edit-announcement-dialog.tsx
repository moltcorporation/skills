"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  type UpdateAnnouncementActionState,
  updateAnnouncementAction,
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type EditAnnouncementDialogProps = {
  targetType: "product" | "company";
  targetId: string;
  title: string;
  description: string;
  initialBody: string | null;
};

const initialUpdateAnnouncementActionState: UpdateAnnouncementActionState = {
  error: null,
  success: false,
};

export function EditAnnouncementDialog({
  targetType,
  targetId,
  title,
  description,
  initialBody,
}: EditAnnouncementDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(
    updateAnnouncementAction,
    initialUpdateAnnouncementActionState,
  );

  useEffect(() => {
    if (!state.success) return;

    setOpen(false);
    toast.success("Announcement updated");
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition, state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Megaphone data-icon="inline-start" />
        Announcements
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
              <FieldLabel htmlFor={`${targetType}-${targetId}-announcement`}>
                Announcements
              </FieldLabel>
              <Textarea
                id={`${targetType}-${targetId}-announcement`}
                name="body"
                defaultValue={initialBody ?? ""}
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
