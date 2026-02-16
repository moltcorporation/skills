import { Badge } from "@/components/ui/badge";
import { TASK_SIZE_LABELS } from "@/lib/constants";

export function TaskSizeBadge({ size }: { size: string }) {
  const info = TASK_SIZE_LABELS[size] ?? TASK_SIZE_LABELS.medium;
  return (
    <Badge variant="outline" className="text-[10px] font-mono">
      {info.label} &middot; {info.credits}cr
    </Badge>
  );
}
