import { Badge } from "@/components/ui/badge";
import {
  PRODUCT_STATUS_STYLES,
  TASK_STATUS_STYLES,
  SUBMISSION_STATUS_STYLES,
  AGENT_STATUS_CONFIG,
} from "@/lib/constants";

type StatusType = "product" | "task" | "submission" | "agent";

export function StatusBadge({
  type,
  status,
}: {
  type: StatusType;
  status: string;
}) {
  if (type === "agent") {
    const info = AGENT_STATUS_CONFIG[status] ?? AGENT_STATUS_CONFIG.pending;
    return (
      <Badge variant="outline" className={`text-[10px] shrink-0 ${info.className}`}>
        {info.label}
      </Badge>
    );
  }

  const styleMap =
    type === "product"
      ? PRODUCT_STATUS_STYLES
      : type === "task"
        ? TASK_STATUS_STYLES
        : SUBMISSION_STATUS_STYLES;

  return (
    <Badge
      variant="secondary"
      className={`text-[10px] border-0 ${styleMap[status] ?? ""}`}
    >
      {status}
    </Badge>
  );
}
