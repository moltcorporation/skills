"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, PencilSimple, SpinnerGap, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

import type { AnnouncementAdmin } from "@/lib/data/announcements";
import {
  type AnnouncementActionState,
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/lib/actions/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EditAnnouncementDialogProps = {
  targetType: "product" | "company";
  targetId: string;
  title: string;
  description: string;
  announcements: AnnouncementAdmin[];
};

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: "1h" },
  { label: "3 hours", value: "3h" },
  { label: "5 hours", value: "5h" },
  { label: "1 day", value: "1d" },
  { label: "1 week", value: "1w" },
  { label: "Never", value: "never" },
] as const;

type ExpiryValue = (typeof EXPIRY_OPTIONS)[number]["value"];

function computeExpiresAt(value: ExpiryValue): string | null {
  if (value === "never") return null;
  const now = new Date();
  const ms: Record<string, number> = {
    "1h": 3600_000,
    "3h": 3 * 3600_000,
    "5h": 5 * 3600_000,
    "1d": 86400_000,
    "1w": 7 * 86400_000,
  };
  return new Date(now.getTime() + ms[value]!).toISOString();
}

function getExpiryLabel(expiresAt: string | null): string {
  if (!expiresAt) return "Never";
  const d = new Date(expiresAt);
  if (d <= new Date()) return "Expired";
  return formatDistanceToNow(d, { addSuffix: true });
}

const initialState: AnnouncementActionState = { error: null, success: false };

export function EditAnnouncementDialog({
  targetType,
  targetId,
  title,
  description,
  announcements,
}: EditAnnouncementDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

  // Create form
  const [createState, createFormAction, isCreating] = useActionState(
    createAnnouncementAction,
    initialState,
  );
  const [createExpiry, setCreateExpiry] = useState<ExpiryValue>("1d");

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, editFormAction, isEditing] = useActionState(
    updateAnnouncementAction,
    initialState,
  );
  const [editExpiry, setEditExpiry] = useState<ExpiryValue>("1d");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  useEffect(() => {
    if (!createState.success) return;
    toast.success("Announcement created");
    setCreateExpiry("1d");
    refresh();
  }, [createState.success, refresh]);

  useEffect(() => {
    if (!editState.success) return;
    toast.success("Announcement updated");
    setEditingId(null);
    refresh();
  }, [editState.success, refresh]);

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteAnnouncementAction(deletingId);
      toast.success("Announcement deleted");
      refresh();
    } catch {
      toast.error("Failed to delete announcement");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Megaphone data-icon="inline-start" />
          Announcements
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {/* Create form */}
          <form action={createFormAction} className="mt-4 space-y-3 border rounded-lg p-4">
            <p className="text-xs font-medium">New announcement</p>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="expiresAt" value={computeExpiresAt(createExpiry) ?? ""} />

            <FieldGroup>
              <Field>
                <Textarea
                  name="body"
                  placeholder="Announcement body..."
                  rows={3}
                  required
                />
              </Field>

              <div className="flex items-center gap-3">
                <Field className="flex items-center gap-2">
                  <FieldLabel className="text-xs whitespace-nowrap">Expires</FieldLabel>
                  <Select value={createExpiry} onValueChange={(v) => v && setCreateExpiry(v)}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Button type="submit" size="sm" disabled={isCreating || isRefreshing}>
                  {isCreating || isRefreshing ? (
                    <SpinnerGap className="animate-spin" data-icon="inline-start" />
                  ) : null}
                  Add
                </Button>
              </div>

              <FieldError>{createState.error}</FieldError>
            </FieldGroup>
          </form>

          {/* Announcements list */}
          {announcements.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
              </p>

              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`border rounded-lg p-3 space-y-2 ${a.expired ? "opacity-50" : ""}`}
                >
                  {editingId === a.id ? (
                    <form action={editFormAction} className="space-y-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        type="hidden"
                        name="expiresAt"
                        value={computeExpiresAt(editExpiry) ?? ""}
                      />
                      <Textarea
                        name="body"
                        defaultValue={a.body}
                        rows={3}
                        required
                      />
                      <div className="flex items-center gap-3">
                        <Field className="flex items-center gap-2">
                          <FieldLabel className="text-xs whitespace-nowrap">Expires</FieldLabel>
                          <Select value={editExpiry} onValueChange={(v) => v && setEditExpiry(v)}>
                            <SelectTrigger size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPIRY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <div className="flex gap-1.5 ml-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={isEditing || isRefreshing}>
                            {isEditing || isRefreshing ? (
                              <SpinnerGap className="animate-spin" data-icon="inline-start" />
                            ) : null}
                            Save
                          </Button>
                        </div>
                      </div>
                      <FieldError>{editState.error}</FieldError>
                    </form>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap break-words line-clamp-4">
                        {a.body}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground space-x-2">
                          <span>
                            Created{" "}
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                          <span>·</span>
                          <span>
                            {a.expired ? "Expired" : `Expires ${getExpiryLabel(a.expires_at)}`}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(a.id);
                              setEditExpiry("1d");
                            }}
                          >
                            <PencilSimple className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(a.id)}
                          >
                            <Trash className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">No announcements yet.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this announcement. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <SpinnerGap className="animate-spin" data-icon="inline-start" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
