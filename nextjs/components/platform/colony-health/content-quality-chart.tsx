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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ColonyHealthSnapshot } from "@/lib/data/colony-health";
import type { ConfigChange } from "@/lib/data/colony-health";
import { MetricInfo } from "./metric-info";

const discussionConfig = {
  commentsPerPostMedian24h: {
    label: "Comments/post (median)",
    color: "var(--chart-1)",
  },
  uniqueCommentersPerPostAvg: {
    label: "Unique commenters/post",
    color: "var(--chart-2)",
  },
  replyDepthAvg24h: {
    label: "Reply depth (avg)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const engagementConfig = {
  reactionsPerPostAvg24h: {
    label: "Reactions/post (avg)",
    color: "var(--chart-4)",
  },
  voteUnanimousRate: {
    label: "Unanimous vote rate (%)",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContentQualityChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const discussionData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    commentsPerPostMedian24h: s.comments_per_post_median_24h
      ? Number(Number(s.comments_per_post_median_24h).toFixed(1))
      : null,
    uniqueCommentersPerPostAvg: s.unique_commenters_per_post_avg
      ? Number(Number(s.unique_commenters_per_post_avg).toFixed(1))
      : null,
    replyDepthAvg24h: s.reply_depth_avg_24h
      ? Number(Number(s.reply_depth_avg_24h).toFixed(1))
      : null,
  }));

  const engagementData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    reactionsPerPostAvg24h: s.reactions_per_post_avg_24h
      ? Number(Number(s.reactions_per_post_avg_24h).toFixed(1))
      : null,
    voteUnanimousRate: s.vote_unanimous_rate_7d
      ? Math.round((s.vote_unanimous_rate_7d as number) * 100)
      : null,
  }));

  const changeLabels = configChanges.map((c) => ({
    label: formatTime(c.changed_at),
    note: `${c.config_key}: ${c.old_value ?? "\u2014"} \u2192 ${c.new_value}`,
  }));

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              Discussion quality
              <MetricInfo metric="commentsPerPostMedian24h" />
            </CardTitle>
            <CardDescription>
              Comment depth, volume, and diversity per post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={discussionConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={discussionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {changeLabels.map((c, i) => (
                  <ReferenceLine
                    key={i}
                    x={c.label}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 2"
                    label={{ value: "\u2699", position: "top", fontSize: 10 }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="commentsPerPostMedian24h"
                  stroke="var(--color-commentsPerPostMedian24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="uniqueCommentersPerPostAvg"
                  stroke="var(--color-uniqueCommentersPerPostAvg)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="replyDepthAvg24h"
                  stroke="var(--color-replyDepthAvg24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              Engagement & consensus
              <MetricInfo metric="voteUnanimousRate7d" />
            </CardTitle>
            <CardDescription>
              Reaction volume and vote unanimity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={engagementConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {changeLabels.map((c, i) => (
                  <ReferenceLine
                    key={i}
                    x={c.label}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 2"
                    label={{ value: "\u2699", position: "top", fontSize: 10 }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="reactionsPerPostAvg24h"
                  stroke="var(--color-reactionsPerPostAvg24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="voteUnanimousRate"
                  stroke="var(--color-voteUnanimousRate)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
