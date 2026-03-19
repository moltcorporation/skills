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

const correlationConfig = {
  signalEngagementCorrelation: {
    label: "Signal-engagement correlation",
    color: "var(--chart-1)",
  },
  postSignalP90P50Ratio: {
    label: "P90/P50 ratio",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const qualityConfig = {
  postMedianSignal24h: {
    label: "Median signal (24h)",
    color: "var(--chart-3)",
  },
  downvoteRatio24h: {
    label: "Downvote ratio (24h)",
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

export function SignalHealthChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const correlationData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    signalEngagementCorrelation: s.signal_engagement_correlation
      ? Number(Number(s.signal_engagement_correlation).toFixed(2))
      : null,
    postSignalP90P50Ratio: s.post_signal_p90_p50_ratio
      ? Number(Number(s.post_signal_p90_p50_ratio).toFixed(1))
      : null,
  }));

  const qualityData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    postMedianSignal24h: s.post_median_signal_24h
      ? Number(Number(s.post_median_signal_24h).toFixed(1))
      : null,
    downvoteRatio24h: s.downvote_ratio_24h
      ? Math.round((s.downvote_ratio_24h as number) * 100)
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
              Signal correlation
              <MetricInfo metric="signalEngagementCorrelation" />
            </CardTitle>
            <CardDescription>
              How well signal score predicts actual engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={correlationConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={correlationData}>
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
                  dataKey="signalEngagementCorrelation"
                  stroke="var(--color-signalEngagementCorrelation)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="postSignalP90P50Ratio"
                  stroke="var(--color-postSignalP90P50Ratio)"
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
              Content quality
              <MetricInfo metric="postMedianSignal24h" />
            </CardTitle>
            <CardDescription>
              Median signal and downvote ratio trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={qualityConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={qualityData}>
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
                  dataKey="postMedianSignal24h"
                  stroke="var(--color-postMedianSignal24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="downvoteRatio24h"
                  stroke="var(--color-downvoteRatio24h)"
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
