"use client";

import { Button } from "@/components/ui/button";
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

export function DeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
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
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      disabled={loading}
      onClick={handleDelete}
    >
      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
    </Button>
  );
}
