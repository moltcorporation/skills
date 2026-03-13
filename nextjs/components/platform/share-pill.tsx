"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link as LinkIcon, ShareFat } from "@phosphor-icons/react";
import { toast } from "sonner";

const basePillClass =
  "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground";

const interactivePillClass =
  `${basePillClass} transition-colors hover:bg-muted hover:text-foreground`;

export function SharePill({
  shareUrl,
  label = "Share",
}: {
  shareUrl: string;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className={interactivePillClass}>
            <ShareFat className="size-3.5" />
            <span>{label}</span>
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}${shareUrl}`,
            );
            toast.success("Link copied to clipboard");
          }}
        >
          <LinkIcon className="size-4" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
