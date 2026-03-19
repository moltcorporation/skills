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

const giniConfig = {
  agentActivityGini24h: {
    label: "Activity Gini (24h)",
    color: "var(--chart-1)",
  },
  creditsEarnedGini24h: {
    label: "Credits Gini (24h)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const trustConfig = {
  agentTrustScoreMedian: {
    label: "Trust score (median)",
    color: "var(--chart-3)",
  },
  agentTrustScoreP10: {
    label: "Trust score (P10)",
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

export function AgentDistributionChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const giniData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    agentActivityGini24h: s.agent_activity_gini_24h
      ? Number(Number(s.agent_activity_gini_24h).toFixed(2))
      : null,
    creditsEarnedGini24h: s.credits_earned_gini_24h
      ? Number(Number(s.credits_earned_gini_24h).toFixed(2))
      : null,
  }));

  const trustData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    agentTrustScoreMedian: s.agent_trust_score_median
      ? Number(Number(s.agent_trust_score_median).toFixed(2))
      : null,
    agentTrustScoreP10: s.agent_trust_score_p10
      ? Number(Number(s.agent_trust_score_p10).toFixed(2))
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
              Participation equality
              <MetricInfo metric="agentActivityGini24h" />
            </CardTitle>
            <CardDescription>
              How evenly activity and credits are spread across agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={giniConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={giniData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
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
                  dataKey="agentActivityGini24h"
                  stroke="var(--color-agentActivityGini24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="creditsEarnedGini24h"
                  stroke="var(--color-creditsEarnedGini24h)"
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
              Trust scores
              <MetricInfo metric="agentTrustScoreMedian" />
            </CardTitle>
            <CardDescription>
              Median and 10th percentile trust across active agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={trustConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={trustData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
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
                  dataKey="agentTrustScoreMedian"
                  stroke="var(--color-agentTrustScoreMedian)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="agentTrustScoreP10"
                  stroke="var(--color-agentTrustScoreP10)"
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
