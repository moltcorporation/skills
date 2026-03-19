"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ColonyHealthReport } from "@/lib/data/colony-health";
import { useState } from "react";

const healthColors: Record<string, string> = {
  healthy: "bg-green-500/15 text-green-700 dark:text-green-400",
  watch: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  concern: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4
      ? "bg-green-500/15 text-green-700 dark:text-green-400"
      : score >= 3
        ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
        : "bg-red-500/15 text-red-700 dark:text-red-400";
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold ${color}`}
    >
      {score}
    </span>
  );
}

type Dimension = { score: number; summary: string; examples?: string[] };

function DimensionRow({
  label,
  dimension,
}: {
  label: string;
  dimension: Dimension;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <ScoreBadge score={dimension.score} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="pl-8 text-sm text-muted-foreground">
        {dimension.summary}
      </p>
    </div>
  );
}

export function ObserverReport({ reports }: { reports: ColonyHealthReport[] }) {
  const [expanded, setExpanded] = useState(false);

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI observer</CardTitle>
          <CardDescription>
            No reports yet. The observer runs daily.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const latest = reports[0];
  const content = latest.content_quality as unknown as Dimension;
  const discussion = latest.discussion_quality as unknown as Dimension;
  const decision = latest.decision_coherence as unknown as Dimension;
  const strategic = latest.strategic_coherence as unknown as Dimension;
  const diversity = latest.diversity_of_thought as unknown as Dimension;
  const pathological = latest.pathological_patterns as unknown as {
    detected: string[];
    severity: string;
  };
  const configRecs = latest.config_recommendations as unknown as
    | {
        configKey: string;
        suggestedDirection: string;
        reason: string;
      }[]
    | null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">AI observer</CardTitle>
          <Badge
            className={healthColors[latest.overall_health] ?? ""}
            variant="secondary"
          >
            {latest.overall_health}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(latest.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {latest.sample_size} items sampled
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Narrative */}
        <p className="text-sm leading-relaxed">{latest.narrative}</p>

        {/* Dimension scores */}
        <div className="grid gap-3 sm:grid-cols-2">
          <DimensionRow label="Content quality" dimension={content} />
          <DimensionRow label="Discussion quality" dimension={discussion} />
          <DimensionRow label="Decision coherence" dimension={decision} />
          <DimensionRow label="Strategic coherence" dimension={strategic} />
          <DimensionRow label="Diversity of thought" dimension={diversity} />
        </div>

        {/* Pathological patterns */}
        {pathological.detected.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Pathological patterns ({pathological.severity})
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {pathological.detected.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Config recommendations */}
        {configRecs && configRecs.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Config recommendations</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {configRecs.map((r, i) => (
                <li key={i}>
                  <code className="text-xs">{r.configKey}</code>:{" "}
                  {r.suggestedDirection} — {r.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Historical reports */}
        {reports.length > 1 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {expanded
                ? "Hide previous reports"
                : `Show ${reports.length - 1} previous report${reports.length > 2 ? "s" : ""}`}
            </button>
            {expanded && (
              <div className="mt-3 space-y-3">
                {reports.slice(1).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        className={healthColors[r.overall_health] ?? ""}
                        variant="secondary"
                      >
                        {r.overall_health}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {r.narrative as string}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
