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

const chartConfig = {
  claimRate4h: {
    label: "Claim rate (4h)",
    color: "var(--chart-1)",
  },
  approvalRate: {
    label: "Approval rate",
    color: "var(--chart-2)",
  },
  engagementDepth: {
    label: "Engagement depth",
    color: "var(--chart-3)",
  },
  productSpreadGini: {
    label: "Product spread (Gini)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const velocityConfig = {
  taskVelocityClaimMedianHours: {
    label: "Claim velocity (h)",
    color: "var(--chart-1)",
  },
  taskVelocityApproveMedianHours: {
    label: "Approve velocity (h)",
    color: "var(--chart-2)",
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

function formatPercent(v: number | null) {
  if (v === null) return null;
  return Math.round(v * 100);
}

export function VitalSignsChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const rateData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    claimRate4h: formatPercent(s.claim_rate_4h as number | null),
    approvalRate: formatPercent(s.approval_rate as number | null),
    engagementDepth: formatPercent(s.engagement_depth as number | null),
    productSpreadGini: s.product_spread_gini
      ? Math.round((s.product_spread_gini as number) * 100)
      : null,
  }));

  const velocityData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    taskVelocityClaimMedianHours: s.task_velocity_claim_median_hours
      ? Number(Number(s.task_velocity_claim_median_hours).toFixed(1))
      : null,
    taskVelocityApproveMedianHours: s.task_velocity_approve_median_hours
      ? Number(Number(s.task_velocity_approve_median_hours).toFixed(1))
      : null,
  }));

  // Map config change timestamps to chart x labels for reference lines
  const changeLabels = configChanges.map((c) => ({
    label: formatTime(c.changed_at),
    note: `${c.config_key}: ${c.old_value ?? "—"} → ${c.new_value}`,
  }));

  return (
    <TooltipProvider>
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-1.5">
            Rates
            <MetricInfo metric="claimRate4h" />
          </CardTitle>
          <CardDescription>
            Claim, approval, engagement, and spread (% scale)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <LineChart data={rateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {changeLabels.map((c, i) => (
                <ReferenceLine
                  key={i}
                  x={c.label}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 2"
                  label={{ value: "⚙", position: "top", fontSize: 10 }}
                />
              ))}
              <Line
                type="monotone"
                dataKey="claimRate4h"
                stroke="var(--color-claimRate4h)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="approvalRate"
                stroke="var(--color-approvalRate)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="engagementDepth"
                stroke="var(--color-engagementDepth)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="productSpreadGini"
                stroke="var(--color-productSpreadGini)"
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
            Velocity
            <MetricInfo metric="taskVelocityClaimMedianHours" />
          </CardTitle>
          <CardDescription>Median hours for claim and approval</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={velocityConfig}
            className="aspect-[2/1] w-full"
          >
            <LineChart data={velocityData}>
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
                  label={{ value: "⚙", position: "top", fontSize: 10 }}
                />
              ))}
              <Line
                type="monotone"
                dataKey="taskVelocityClaimMedianHours"
                stroke="var(--color-taskVelocityClaimMedianHours)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="taskVelocityApproveMedianHours"
                stroke="var(--color-taskVelocityApproveMedianHours)"
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
