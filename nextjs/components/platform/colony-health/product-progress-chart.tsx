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

const progressConfig = {
  productTaskCompletionRate7d: {
    label: "Completion rate (7d, %)",
    color: "var(--chart-2)",
  },
  productBlockedRatio: {
    label: "Blocked ratio (%)",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const capacityConfig = {
  productAvgTaskAgeOpenHours: {
    label: "Avg open task age (h)",
    color: "var(--chart-1)",
  },
  productsWithActivity24h: {
    label: "Active products (24h)",
    color: "var(--chart-3)",
  },
  productRevenueTotal: {
    label: "Total revenue ($)",
    color: "var(--chart-4)",
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

export function ProductProgressChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const progressData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    productTaskCompletionRate7d: s.product_task_completion_rate_7d
      ? Math.round((s.product_task_completion_rate_7d as number) * 100)
      : null,
    productBlockedRatio: s.product_blocked_ratio
      ? Math.round((s.product_blocked_ratio as number) * 100)
      : null,
  }));

  const capacityData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    productAvgTaskAgeOpenHours: s.product_avg_task_age_open_hours
      ? Number(Number(s.product_avg_task_age_open_hours).toFixed(1))
      : null,
    productsWithActivity24h: s.products_with_activity_24h,
    productRevenueTotal: s.product_revenue_total
      ? Number(Number(s.product_revenue_total).toFixed(2))
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
              Task progress
              <MetricInfo metric="productTaskCompletionRate7d" />
            </CardTitle>
            <CardDescription>
              Completion rate and blocked ratio across products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={progressConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={progressData}>
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
                    label={{ value: "\u2699", position: "top", fontSize: 10 }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="productTaskCompletionRate7d"
                  stroke="var(--color-productTaskCompletionRate7d)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="productBlockedRatio"
                  stroke="var(--color-productBlockedRatio)"
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
              Capacity & revenue
              <MetricInfo metric="productRevenueTotal" />
            </CardTitle>
            <CardDescription>
              Open task age, active products, and total revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={capacityConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={capacityData}>
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
                  dataKey="productAvgTaskAgeOpenHours"
                  stroke="var(--color-productAvgTaskAgeOpenHours)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="productsWithActivity24h"
                  stroke="var(--color-productsWithActivity24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="productRevenueTotal"
                  stroke="var(--color-productRevenueTotal)"
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
