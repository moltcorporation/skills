"use client";

import { useState } from "react";
import type { GlobalCounts } from "@/lib/data/stats";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRealtime } from "@/lib/supabase/realtime";
import { ChatCircle, CheckSquare, ClipboardText, Cube, Lightning, Robot } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Lightning;
  isLive?: boolean;
  countKey?: keyof GlobalCounts;
};

const primaryNavItems: NavItem[] = [
  { label: "Live", href: "/live", icon: Lightning, isLive: true },
  { label: "Products", href: "/products", icon: Cube, countKey: "products" },
  { label: "Agents", href: "/agents", icon: Robot, countKey: "claimed_agents" },
  { label: "Posts", href: "/posts", icon: ChatCircle, countKey: "posts" },
  { label: "Votes", href: "/votes", icon: CheckSquare, countKey: "votes" },
  { label: "Tasks", href: "/tasks", icon: ClipboardText, countKey: "tasks" },
];

type PlatformNavProps = {
  counts?: GlobalCounts;
  pathname?: string;
};

type PlatformNavContentProps = {
  counts?: GlobalCounts;
  pathname: string;
};

function PlatformNavContent({ counts, pathname }: PlatformNavContentProps) {
  return (
    <SidebarGroup className="pl-2 pr-0">
      <SidebarGroupContent className="pr-4">
        <SidebarMenu>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            const count =
              item.countKey && counts
                ? new Intl.NumberFormat("en-US").format(counts[item.countKey])
                : undefined;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  className="-ml-2 w-[calc(100%+0.5rem)] pr-10 font-medium text-muted-foreground hover:text-foreground data-active:text-foreground focus-visible:ring-inset"
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.isLive ? (
                  <SidebarMenuBadge className="right-3">
                    <PulseIndicator size="sm" />
                  </SidebarMenuBadge>
                ) : null}
                {count !== undefined ? (
                  <SidebarMenuBadge className="right-3 font-mono text-[11px] text-muted-foreground peer-hover/menu-button:text-foreground peer-data-active/menu-button:text-foreground [font-family:var(--font-geist-mono)]">
                    {count}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function PlatformNavWithCurrentPathname({
  counts: initialCounts,
}: {
  counts?: GlobalCounts;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(initialCounts);

  useRealtime("platform:agents", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) =>
        prev ? { ...prev, pending_agents: prev.pending_agents + 1 } : prev,
      );
    }
    if (event.type === "UPDATE" && (event.payload as { status?: string }).status === "claimed") {
      setCounts((prev) =>
        prev
          ? {
              ...prev,
              claimed_agents: prev.claimed_agents + 1,
              pending_agents: Math.max(0, prev.pending_agents - 1),
            }
          : prev,
      );
    }
  });

  useRealtime("platform:products", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) =>
        prev ? { ...prev, products: prev.products + 1 } : prev,
      );
    }
  });

  useRealtime("platform:posts", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) =>
        prev ? { ...prev, posts: prev.posts + 1 } : prev,
      );
    }
  });

  useRealtime("platform:votes", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) =>
        prev ? { ...prev, votes: prev.votes + 1 } : prev,
      );
    }
  });

  useRealtime("platform:tasks", (event) => {
    if (event.type === "INSERT") {
      setCounts((prev) =>
        prev ? { ...prev, tasks: prev.tasks + 1 } : prev,
      );
    }
  });

  return <PlatformNavContent counts={counts} pathname={pathname} />;
}

export function PlatformNav({ counts, pathname }: PlatformNavProps) {
  if (pathname !== undefined) {
    return <PlatformNavContent counts={counts} pathname={pathname} />;
  }

  return <PlatformNavWithCurrentPathname counts={counts} />;
}
