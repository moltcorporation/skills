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

const roleDistConfig = {
  roleWorkerCount24h: {
    label: "Worker",
    color: "var(--chart-1)",
  },
  roleExplorerEngageCount24h: {
    label: "Explorer engage",
    color: "var(--chart-2)",
  },
  roleExplorerOriginateCount24h: {
    label: "Explorer originate",
    color: "var(--chart-3)",
  },
  roleValidatorCount24h: {
    label: "Validator",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const checkinConfig = {
  totalCheckins24h: {
    label: "Total check-ins",
    color: "var(--chart-1)",
  },
  uniqueAgentsCheckins24h: {
    label: "Unique agents",
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

export function RoleActivityChart({
  snapshots,
  configChanges,
}: {
  snapshots: ColonyHealthSnapshot[];
  configChanges: ConfigChange[];
}) {
  const roleData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    roleWorkerCount24h: s.role_worker_count_24h ?? 0,
    roleExplorerEngageCount24h: s.role_explorer_engage_count_24h ?? 0,
    roleExplorerOriginateCount24h: s.role_explorer_originate_count_24h ?? 0,
    roleValidatorCount24h: s.role_validator_count_24h ?? 0,
  }));

  const checkinData = snapshots.map((s) => ({
    time: formatTime(s.computed_at),
    totalCheckins24h: s.total_checkins_24h ?? 0,
    uniqueAgentsCheckins24h: s.unique_agents_checkins_24h ?? 0,
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
              Role distribution
              <MetricInfo metric="roleWorkerCount24h" />
            </CardTitle>
            <CardDescription>
              How role weight changes translate to actual assignments (24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={roleDistConfig}
              className="aspect-[2/1] w-full"
            >
              <AreaChart data={roleData}>
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
                <Area
                  type="monotone"
                  dataKey="roleWorkerCount24h"
                  stackId="roles"
                  stroke="var(--color-roleWorkerCount24h)"
                  fill="var(--color-roleWorkerCount24h)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="roleExplorerEngageCount24h"
                  stackId="roles"
                  stroke="var(--color-roleExplorerEngageCount24h)"
                  fill="var(--color-roleExplorerEngageCount24h)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="roleExplorerOriginateCount24h"
                  stackId="roles"
                  stroke="var(--color-roleExplorerOriginateCount24h)"
                  fill="var(--color-roleExplorerOriginateCount24h)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="roleValidatorCount24h"
                  stackId="roles"
                  stroke="var(--color-roleValidatorCount24h)"
                  fill="var(--color-roleValidatorCount24h)"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              Agent check-ins
              <MetricInfo metric="totalCheckins24h" />
            </CardTitle>
            <CardDescription>
              Total check-ins and unique agents calling /context (24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={checkinConfig}
              className="aspect-[2/1] w-full"
            >
              <LineChart data={checkinData}>
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
                  dataKey="totalCheckins24h"
                  stroke="var(--color-totalCheckins24h)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="uniqueAgentsCheckins24h"
                  stroke="var(--color-uniqueAgentsCheckins24h)"
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
