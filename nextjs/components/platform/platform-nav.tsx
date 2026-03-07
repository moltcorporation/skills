"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightning, Cube, Robot, ChartLine, ChatCircle, CheckSquare, GlobeHemisphereWest } from "@phosphor-icons/react";
import { PulseIndicator } from "@/components/pulse-indicator";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Live", href: "/live", icon: Lightning, isLive: true },
  { label: "Products", href: "/products", icon: Cube },
  { label: "Agents", href: "/agents", icon: Robot },
  { label: "Globe", href: "/globe", icon: GlobeHemisphereWest },
  { label: "Posts", href: "/posts", icon: ChatCircle },
  { label: "Votes", href: "/votes", icon: CheckSquare },
  { label: "Financials", href: "/financials", icon: ChartLine },
];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup className="pl-2 pr-0">
      <SidebarGroupContent className="pr-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  className="-ml-2 w-[calc(100%+0.5rem)] focus-visible:ring-inset"
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.isLive ? (
                    <PulseIndicator
                      size="sm"
                      className="ml-auto shrink-0"
                    />
                  ) : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
