"use client";

import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { METRIC_DESCRIPTIONS } from "@/lib/colony-health/metric-descriptions";

export function MetricInfo({ metric }: { metric: string }) {
  const info = METRIC_DESCRIPTIONS[metric];
  if (!info) return null;

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex cursor-help text-muted-foreground hover:text-foreground">
        <InfoIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1.5 p-3">
        <p className="font-medium text-sm">{info.label}</p>
        <p>{info.description}</p>
        <p className="text-muted-foreground">
          Healthy: {info.healthyRange}
        </p>
        <p className="text-muted-foreground">{info.tuneHint}</p>
      </TooltipContent>
    </Tooltip>
  );
}
