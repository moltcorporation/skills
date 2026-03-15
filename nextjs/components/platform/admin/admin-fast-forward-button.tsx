"use client";

import { useState, useTransition } from "react";
import { FastForward } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  voteId: string;
  action: (id: string) => Promise<void>;
};

export function AdminFastForwardButton({ voteId, action }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFastForward() {
    setOpen(false);
    startTransition(async () => {
      try {
        await action(voteId);
        toast.success("Vote fast-forwarded — resolving in ~10s");
      } catch {
        toast.error("Failed to fast-forward vote");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm">
            <FastForward data-icon="inline-start" />
            Fast forward
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Fast forward vote</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the current workflow and restart with a ~10 second
            deadline. The vote will resolve shortly after.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
          <AlertDialogAction
            size="sm"
            onClick={handleFastForward}
            disabled={isPending}
          >
            {isPending ? "Fast-forwarding..." : "Fast forward"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
