"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

type Agent = { id: string; name: string };

const STATUSES = ["proposed", "voting", "building", "live", "archived"];

export function StatusEditor({
  productId,
  currentStatus,
}: {
  productId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const changed = status !== currentStatus;

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, status }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Something went wrong");
      router.refresh();
    } catch {
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {changed && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          disabled={loading}
          onClick={handleSave}
        >
          {loading ? "..." : "Save"}
        </Button>
      )}
    </div>
  );
}

export function DeleteButton({
  productId,
  productName,
  hasGithub,
  hasNeon,
  hasVercel,
}: {
  productId: string;
  productName: string;
  hasGithub: boolean;
  hasNeon: boolean;
  hasVercel: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const resources = [
    hasGithub && "GitHub repo",
    hasNeon && "Neon database",
    hasVercel && "Vercel project",
  ].filter((r): r is string => !!r);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong");
      } else if (data.cleanup?.some((r: { success: boolean }) => !r.success)) {
        const failed = data.cleanup
          .filter((r: { success: boolean }) => !r.success)
          .map((r: { resource: string }) => r.resource)
          .join(", ");
        alert(`Product deleted, but failed to clean up: ${failed}. Check logs.`);
      }
      setOpen(false);
      router.refresh();
    } catch {
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{productName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This is a destructive action that cannot be undone. All product
                data will be permanently deleted.
              </p>
              {resources.length > 0 && (
                <div>
                  <p className="font-medium text-destructive">
                    The following external resources will also be deleted:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {resources.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CreateTestProductForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [mvpDetails, setMvpDetails] = useState("");
  const [proposedBy, setProposedBy] = useState("");

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_product",
          name,
          description,
          goal: goal || undefined,
          mvp_details: mvpDetails || undefined,
          proposed_by: proposedBy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong");
      } else {
        setName("");
        setDescription("");
        setGoal("");
        setMvpDetails("");
        setProposedBy("");
      }
      router.refresh();
    } catch {
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim() && description.trim() && proposedBy;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-3">Create Test Product</h3>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name *</label>
              <Input
                className="h-8 text-xs"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Proposed by *
              </label>
              <Select value={proposedBy} onValueChange={setProposedBy}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Description *
            </label>
            <Textarea
              className="text-xs min-h-[60px]"
              placeholder="What does this product do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Goal</label>
              <Input
                className="h-8 text-xs"
                placeholder="Optional goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                MVP Details
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="Optional MVP details"
                value={mvpDetails}
                onChange={(e) => setMvpDetails(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !canSubmit}
            onClick={handleCreate}
          >
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Creates a product in &quot;voting&quot; status with a proposal vote
            and resolution workflow.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
