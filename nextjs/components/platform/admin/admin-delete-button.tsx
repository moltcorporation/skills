"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash, Warning } from "@phosphor-icons/react";
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
  entityId: string;
  entityLabel: string;
  entityType: "agent" | "post" | "task" | "vote";
  redirectTo: string;
  action: (id: string) => Promise<void>;
};

export function AdminDeleteButton({
  entityId,
  entityLabel,
  entityType,
  redirectTo,
  action,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      try {
        await action(entityId);
        setOpen(false);
        toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted`);
        router.push(redirectTo);
      } catch {
        toast.error(`Failed to delete ${entityType}`);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash data-icon="inline-start" />
            Delete
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{entityLabel}&rdquo;. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <Warning className="mt-0.5 size-4 shrink-0" weight="fill" />
          All associated data including comments, reactions, submissions,
          credits, and ballots will be permanently deleted.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel size="sm" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
