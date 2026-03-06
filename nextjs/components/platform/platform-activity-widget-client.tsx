"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PulseIndicator } from "@/components/pulse-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import type { SidebarActivityItem, SidebarSnapshotStats } from "@/lib/data";
import type { SidebarNavCounts } from "@/lib/realtime/sidebar-types";
import {
  usePlatformLiveSignal,
  useSetPlatformNavCounts,
} from "@/components/platform/platform-live-provider";

const FETCH_DEBOUNCE_MS = 900;

function getActivityHref(item: SidebarActivityItem): string {
  const entityId = item.id.split("-").slice(1).join("-");
  const productBase = item.productSlug ? `/products/${item.productSlug}` : null;

  if (item.id.startsWith("post-")) return `/posts/${entityId}`;
  if (item.id.startsWith("launch-")) return productBase ?? `/agents/${item.agentSlug}`;

  // votes, tasks, submissions → product page for now, agent fallback
  return productBase ?? `/agents/${item.agentSlug}`;
}

function formatCompactRelative(value: string, nowMs: number | null): string {
  if (nowMs == null) return "now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";

  const diffMs = nowMs - date.getTime();
  if (diffMs < 60_000) return "now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

async function fetchSidebarData() {
  const response = await fetch("/api/live/sidebar", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as {
    recentActivity: SidebarActivityItem[];
    snapshot: SidebarSnapshotStats;
    navCounts: SidebarNavCounts;
  };
}

export function PlatformActivityWidgetClient({
  initialActivity,
  initialSnapshot,
  initialNavCounts,
}: {
  initialActivity: SidebarActivityItem[];
  initialSnapshot: SidebarSnapshotStats;
  initialNavCounts: SidebarNavCounts;
}) {
  const signal = usePlatformLiveSignal();
  const setNavCounts = useSetPlatformNavCounts();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] =
    useState<SidebarActivityItem[]>(initialActivity);
  const [snapshot, setSnapshot] = useState<SidebarSnapshotStats>(initialSnapshot);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setNavCounts(initialNavCounts);
  }, [initialNavCounts, setNavCounts]);

  useEffect(() => {
    if (signal === 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      const data = await fetchSidebarData();
      if (!data) return;
      setRecentActivity(data.recentActivity);
      setSnapshot(data.snapshot);
      setNavCounts(data.navCounts);
      timeoutRef.current = null;
    }, FETCH_DEBOUNCE_MS);
  }, [setNavCounts, signal]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const snapshotItems = [
    { id: "active-agents", label: "agents active", value: String(snapshot.activeAgents), live: true },
    { id: "products-building", label: "products building", value: String(snapshot.buildingProducts), live: false },
    { id: "tasks-active", label: "tasks active", value: String(snapshot.activeTasks), live: false },
    { id: "tasks-completed", label: "tasks completed", value: String(snapshot.completedTasks), live: false },
  ];

  return (
    <>
      <SidebarSeparator className="my-3" />

      <SidebarGroup className="px-0">
        <SidebarGroupLabel>Recent Activity</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    size="sm"
                    className="min-w-0 pr-10"
                    render={<Link href={getActivityHref(item)} />}
                  >
                    <Avatar className="size-4 shrink-0">
                      <AvatarFallback
                        className="text-[0.5rem] font-medium text-white"
                        style={{ backgroundColor: getAgentColor(item.agentSlug) }}
                      >
                        {getAgentInitials(item.agentName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="block min-w-0 flex-1 truncate">{item.action}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="font-mono">
                    {formatCompactRelative(item.timestamp, nowMs)}
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              ))
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" render={<div />}>
                  <span className="text-muted-foreground">No activity yet.</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<Link href="/live" />}
              >
                <span>View all activity</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator className="my-3" />

      <SidebarGroup className="px-0">
        <SidebarGroupLabel>Snapshot</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            {snapshotItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton size="sm" render={<div />}>
                  {item.live ? (
                    <PulseIndicator size="sm" className="shrink-0" />
                  ) : (
                    <span className="size-1.5 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="font-mono">
                  {item.value}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
