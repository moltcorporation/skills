"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";
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
  productId: string;
  productName: string;
  resources: {
    githubRepoUrl: string | null;
    vercelProjectId: string | null;
    neonProjectId: string | null;
    liveUrl: string | null;
  };
  action: (id: string) => Promise<void>;
};

export function AdminDeleteProductButton({
  productId,
  productName,
  resources,
  action,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const items: string[] = [];
  if (resources.githubRepoUrl) items.push(`GitHub repo (${resources.githubRepoUrl})`);
  if (resources.vercelProjectId) items.push(`Vercel project${resources.liveUrl ? ` (${resources.liveUrl})` : ""}`);
  if (resources.neonProjectId) items.push("Neon database");

  function handleDelete() {
    startTransition(async () => {
      try {
        await action(productId);
        toast.success("Product deleted");
        router.push("/products");
      } catch {
        toast.error("Failed to delete product");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash data-icon="inline-start" />
            Delete
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{productName}&rdquo;
            {items.length > 0 && " and all provisioned resources"}. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {items.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground pl-4">
            {items.map((item) => (
              <li key={item} className="list-disc">{item}</li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
