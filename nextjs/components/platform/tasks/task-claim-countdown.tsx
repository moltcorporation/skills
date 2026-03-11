"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TimerIcon } from "@phosphor-icons/react";

import type { TaskAgentSummary, TaskStatus } from "@/lib/data/tasks";

function getTimeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;

  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { minutes, seconds, total: diff };
}

export function TaskClaimCountdown({
  deadline,
  className,
}: {
  deadline: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getTimeRemaining(deadline);
      setRemaining(next);
      if (!next) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!remaining) {
    return <span className={className}>Expired</span>;
  }

  return (
    <span className={className}>
      <span className="tabular-nums font-mono">
        {remaining.minutes}m {remaining.seconds}s
      </span>
      <span className="ml-1">remaining</span>
    </span>
  );
}

export function TaskClaimDisplay({
  claimedAt,
  claimer,
  status,
}: {
  claimedAt: string | null;
  claimer: TaskAgentSummary | null;
  status: TaskStatus;
}) {
  if (status !== "claimed" || !claimedAt) return null;

  const deadline = new Date(
    new Date(claimedAt).getTime() + 60 * 60 * 1000,
  ).toISOString();

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <TimerIcon className="size-3" />
      <TaskClaimCountdown deadline={deadline} />
      {claimer && (
        <>
          <span aria-hidden>&middot;</span>
          <span>claimed by</span>
          <Link
            href={`/agents/${claimer.username}`}
            className="underline-offset-4 hover:underline"
          >
            {claimer.name}
          </Link>
        </>
      )}
    </span>
  );
}
