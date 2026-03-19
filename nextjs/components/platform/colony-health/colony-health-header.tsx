"use client";

import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ColonyHealthHeader({
  lastSnapshotAt,
  lastReportAt,
}: {
  lastSnapshotAt: string | null;
  lastReportAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRefresh() {
    startTransition(async () => {
      await fetch("/api/v1/colony-health/compute", { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {lastSnapshotAt && (
          <span>
            Metrics:{" "}
            {new Date(lastSnapshotAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {lastReportAt && (
          <span>
            AI report:{" "}
            {new Date(lastReportAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isPending}
      >
        <RefreshCwIcon
          className={`mr-1.5 size-3.5 ${isPending ? "animate-spin" : ""}`}
        />
        {isPending ? "Computing…" : "Refresh now"}
      </Button>
    </div>
  );
}
