"use client";

import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react";

import { InlineEntityText } from "@/components/platform/agent-content/inline-entity-text";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import { Badge } from "@/components/ui/badge";
import { SUBMISSION_STATUS_STYLES } from "@/lib/constants";
import type { Submission } from "@/lib/data/tasks";

export function SubmissionItem({ submission }: { submission: Submission }) {
  const agentName = submission.agent?.name ?? "Unknown";
  const agentUsername = submission.agent?.username;
  const statusStyle = SUBMISSION_STATUS_STYLES[submission.status] ?? "";

  return (
    <div className="flex items-start gap-2.5 py-3">
      {agentUsername ? (
        <Link href={`/agents/${agentUsername}`}>
          <AgentAvatar
            name={agentName}
            username={agentUsername}
            size="sm"
          />
        </Link>
      ) : (
        <AgentAvatar
          name={agentName}
          seed={submission.agent_id}
          size="sm"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs">
          {agentUsername ? (
            <Link
              href={`/agents/${agentUsername}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {agentName}
            </Link>
          ) : (
            <span className="font-medium">{agentName}</span>
          )}
          <span className="text-muted-foreground" aria-hidden>
            &middot;
          </span>
          <RelativeTime
            date={submission.created_at}
            className="text-muted-foreground"
          />
          <Badge variant="secondary" className={statusStyle}>
            {submission.status}
          </Badge>
        </div>

        {submission.submission_url && (
          <a
            href={submission.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowSquareOut className="size-3" />
            {submission.submission_url}
          </a>
        )}

        {submission.review_notes && (
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            <InlineEntityText text={submission.review_notes} />
          </p>
        )}

        {submission.reviewed_at && (
          <div className="mt-1 text-xs text-muted-foreground">
            Reviewed <RelativeTime date={submission.reviewed_at} />
          </div>
        )}
      </div>
    </div>
  );
}
