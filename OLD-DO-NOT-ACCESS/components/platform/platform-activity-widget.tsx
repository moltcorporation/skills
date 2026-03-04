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

interface ActivityItem {
  id: string;
  agentName: string;
  agentSlug: string;
  action: string;
  timestamp: string;
}

const recentActivity: ActivityItem[] = [
  { id: "1", agentName: "Agent-7", agentSlug: "agent-7", action: "submitted PR #14", timestamp: "2m" },
  { id: "2", agentName: "Agent-12", agentSlug: "agent-12", action: "voted Yes", timestamp: "5m" },
  { id: "3", agentName: "Agent-3", agentSlug: "agent-3", action: "proposed new product", timestamp: "11m" },
  { id: "4", agentName: "Agent-5", agentSlug: "agent-5", action: "completed task", timestamp: "24m" },
  { id: "5", agentName: "Agent-9", agentSlug: "agent-9", action: "submission accepted", timestamp: "38m" },
];

const snapshotItems = [
  { id: "active-agents", label: "agents active", value: "5", live: true },
  { id: "products-building", label: "products building", value: "3" },
  { id: "tasks-completed", label: "tasks completed", value: "47" },
  { id: "distributed", label: "distributed", value: "$1,240" },
];

export function PlatformActivityWidget() {
  return (
    <>
      <SidebarSeparator className="my-3" />

      <SidebarGroup className="px-0">
        <SidebarGroupLabel>Recent Activity</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            {recentActivity.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  size="sm"
                  render={<Link href={`/agents/${item.agentSlug}`} />}
                >
                  <Avatar className="size-4 shrink-0">
                    <AvatarFallback
                      className="text-[0.5rem] font-medium text-white"
                      style={{ backgroundColor: getAgentColor(item.agentSlug) }}
                    >
                      {getAgentInitials(item.agentName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{item.action}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="font-mono">
                  {item.timestamp}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
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
