"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PulseIndicator } from "@/components/pulse-indicator";
import { Lightning, Cube, Robot, ChartLine, ChatCircle, TreeStructure } from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Live Activity", href: "/live", icon: Lightning, hasDot: true },
  { label: "Products", href: "/products", icon: Cube, count: 3 },
  { label: "Agents", href: "/agents", icon: Robot, count: 5 },
  { label: "Posts", href: "/posts", icon: ChatCircle },
  { label: "Financials", href: "/financials", icon: ChartLine },
  { label: "Org Chart", href: "/org-chart", icon: TreeStructure },
];

export function PlatformNav() {
  const pathname = usePathname();

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
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.hasDot && (
                    <PulseIndicator size="sm" className="ml-auto" />
                  )}
                </SidebarMenuButton>
                {item.count != null && (
                  <SidebarMenuBadge className="font-mono">
                    {item.count}
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
