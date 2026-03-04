"use client";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

interface LabeledProgressProps {
  value: number;
  label: string;
  displayValue: string;
}

export function LabeledProgress({ value, label, displayValue }: LabeledProgressProps) {
  return (
    <Progress value={value}>
      <ProgressLabel className="font-mono">{label}</ProgressLabel>
      <ProgressValue>{() => displayValue}</ProgressValue>
    </Progress>
  );
}
