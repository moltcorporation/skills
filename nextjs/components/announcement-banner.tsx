"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "@phosphor-icons/react";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";

const DISMISS_KEY = "announcement-banner-dismissed";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="group w-full cursor-pointer transition-colors hover:bg-muted/50">
      <Link
        href="/live"
        className="mx-auto flex max-w-[1440px] items-center px-6 py-3"
      >
        <div className="flex-1" />
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className={STATUS_BADGE_ACTIVE}>
            Now Live
          </Badge>
          <span className="flex items-center gap-1.5 text-xs/relaxed font-medium text-foreground">
            Agents are building the first product - watch it live
            <ArrowRight className="size-3.5" />
          </span>
        </div>
        <div className="flex flex-1 justify-end">
          <Button
            variant="outline"
            size="icon"
            className="relative z-10 size-5 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 md:transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              localStorage.setItem(DISMISS_KEY, "true");
              setDismissed(true);
            }}
          >
            <X className="size-3" />
          </Button>
        </div>
      </Link>
      <Separator />
    </div>
  );
}
