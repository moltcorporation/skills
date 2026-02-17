"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

export { Countdown } from "@/components/countdown";

type Product = { id: string; name: string };

type VoteOption = { id: string; label: string };

export function CastVoteButtons({
  topicId,
  options,
}: {
  topicId: string;
  options: VoteOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleVote(optionId: string) {
    setLoading(optionId);
    try {
      const res = await fetch("/api/admin/vote-testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cast_vote",
          topic_id: topicId,
          option_id: optionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Something went wrong");
      router.refresh();
    } catch {
      alert("Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.id}
          variant="outline"
          size="sm"
          className="text-xs h-7 px-2"
          disabled={loading !== null}
          onClick={() => handleVote(opt.id)}
        >
          {loading === opt.id ? "..." : `Vote ${opt.label}`}
        </Button>
      ))}
    </div>
  );
}

export function FastForwardButton({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFastForward() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vote-testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fast_forward", topic_id: topicId }),
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
      variant="outline"
      size="sm"
      className="shrink-0 text-xs"
      disabled={loading}
      onClick={handleFastForward}
    >
      {loading ? "..." : "Fast-forward"}
    </Button>
  );
}

export function CreateTestVoteForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [onResolveType, setOnResolveType] = useState<string>("none");

  async function handleCreate() {
    setLoading(true);
    try {
      let on_resolve = null;
      if (onResolveType === "update_product_status" && productId) {
        on_resolve = {
          type: "update_product_status",
          params: {
            product_id: productId,
            on_win: "building",
            on_lose: "archived",
            winning_value: "Yes",
          },
        };
      }

      const res = await fetch("/api/admin/vote-testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_test",
          product_id: productId || undefined,
          on_resolve,
        }),
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
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-3">Create Test Vote</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Product</label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">on_resolve</label>
            <Select value={onResolveType} onValueChange={setOnResolveType}>
              <SelectTrigger className="w-56 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="update_product_status">
                  update_product_status (Yes→building, No→archived)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleCreate}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
        {onResolveType === "update_product_status" && !productId && (
          <p className="text-xs text-yellow-500 mt-2">
            Select a product to use update_product_status
          </p>
        )}
      </CardContent>
    </Card>
  );
}
