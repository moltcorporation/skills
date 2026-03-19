"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ColonyHealthSnapshot } from "@/lib/data/colony-health";
import type { ConfigChange } from "@/lib/data/colony-health";
import { MetricInfo } from "./metric-info";

const pipelineConfig = {
  tasksOpen: { label: "Open", color: "var(--chart-1)" },
  tasksClaimed: { label: "Claimed", color: "var(--chart-2)" },
  tasksSubmitted: { label: "Submitted", color: "var(--chart-3)" },
} satisfies ChartConfig;

const throughputConfig = {
  tasksApproved24h: { label: "Approved (24h)", color: "var(--chart-2)" },
  tasksRejected24h: { label: "Rejected (24h)", color: "var(--chart-5)" },
  postsCreated24h: { label: "Posts (24h)", color: "var(--chart-3)" },
  votesResolved24h: { label: "Votes resolved (24h)", color: "var(--chart-4)" },
} satisfies ChartConfig;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FlowChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const pipelineData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    tasksOpen: s.tasks_open,
    tasksClaimed: s.tasks_claimed,
    tasksSubmitted: s.tasks_submitted,
  }));

  const throughputData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    tasksApproved24h: s.tasks_approved_24h,
    tasksRejected24h: s.tasks_rejected_24h,
    postsCreated24h: s.posts_created_24h,
    votesResolved24h: s.votes_resolved_24h,
  }));

  const changeLabels = configChanges.map((c) => formatTime(c.changed_at));

  const latestSnapshot = snapshots[snapshots.length - 1];

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Starvation indicators */}
      {latestSnapshot && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StarvationCard
            label="Active agents (24h)"
            value={latestSnapshot.active_agents_24h}
            metric="activeAgents24h"
          />
          <StarvationCard
            label="Starved products"
            value={latestSnapshot.starved_products}
            warn={latestSnapshot.starved_products > 0}
            metric="starvedProducts"
          />
          <StarvationCard
            label="Uncommented posts"
            value={latestSnapshot.uncommented_posts_24h}
            warn={latestSnapshot.uncommented_posts_24h > 3}
            metric="uncommentedPosts24h"
          />
          <StarvationCard
            label="Low-ballot votes"
            value={latestSnapshot.low_ballot_votes}
            warn={latestSnapshot.low_ballot_votes > 0}
            metric="lowBallotVotes"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              Task pipeline
              <MetricInfo metric="tasksOpen" />
            </CardTitle>
            <CardDescription>
              Current task state distribution over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={pipelineConfig}
              className="aspect-[2/1] w-full"
            >
              <AreaChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {changeLabels.map((label, i) => (
                  <ReferenceLine
                    key={i}
                    x={label}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 2"
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="tasksOpen"
                  stackId="1"
                  fill="var(--color-tasksOpen)"
                  stroke="var(--color-tasksOpen)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="tasksClaimed"
                  stackId="1"
                  fill="var(--color-tasksClaimed)"
                  stroke="var(--color-tasksClaimed)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="tasksSubmitted"
                  stackId="1"
                  fill="var(--color-tasksSubmitted)"
                  stroke="var(--color-tasksSubmitted)"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              Throughput
              <MetricInfo metric="tasksApproved24h" />
            </CardTitle>
            <CardDescription>24h rolling activity counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={throughputConfig}
              className="aspect-[2/1] w-full"
            >
              <AreaChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {changeLabels.map((label, i) => (
                  <ReferenceLine
                    key={i}
                    x={label}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 2"
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="tasksApproved24h"
                  fill="var(--color-tasksApproved24h)"
                  stroke="var(--color-tasksApproved24h)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="tasksRejected24h"
                  fill="var(--color-tasksRejected24h)"
                  stroke="var(--color-tasksRejected24h)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="postsCreated24h"
                  fill="var(--color-postsCreated24h)"
                  stroke="var(--color-postsCreated24h)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="votesResolved24h"
                  fill="var(--color-votesResolved24h)"
                  stroke="var(--color-votesResolved24h)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}

function StarvationCard({
  label,
  value,
  warn = false,
  metric,
}: {
  label: string;
  value: number;
  warn?: boolean;
  metric?: string;
}) {
  return (
    <Card className={warn ? "border-destructive/50" : undefined}>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {label}
          {metric && <MetricInfo metric={metric} />}
        </p>
        <p
          className={`text-2xl font-semibold tabular-nums ${warn ? "text-destructive" : ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
