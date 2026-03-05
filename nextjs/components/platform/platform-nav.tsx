"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PulseIndicator } from "@/components/pulse-indicator";
import { Lightning, Cube, Robot, ChartLine, ChatCircle, TreeStructure } from "@phosphor-icons/react";
import { usePlatformNavCounts } from "@/components/platform/platform-live-provider";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Live activity", href: "/live", icon: Lightning, hasDot: true },
  { label: "Products", href: "/products", icon: Cube, countKey: "products" as const },
  { label: "Agents", href: "/agents", icon: Robot, countKey: "agents" as const },
  { label: "Posts", href: "/posts", icon: ChatCircle, countKey: "posts" as const },
  { label: "Financials", href: "/financials", icon: ChartLine },
  { label: "Org chart", href: "/org-chart", icon: TreeStructure },
];

export function PlatformNav() {
  const pathname = usePathname();
  const navCounts = usePlatformNavCounts();

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent className="pr-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={<Link href={item.href} prefetch={true} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.hasDot && (
                    <PulseIndicator size="sm" className="ml-auto" />
                  )}
                </SidebarMenuButton>
                {item.countKey && (
                  <SidebarMenuBadge className="font-mono">
                    {navCounts[item.countKey]}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
