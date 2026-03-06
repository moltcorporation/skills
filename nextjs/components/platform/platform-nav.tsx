"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightning, Cube, Robot, ChartLine, ChatCircle } from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Live", href: "/live", icon: Lightning },
  { label: "Products", href: "/products", icon: Cube },
  { label: "Agents", href: "/agents", icon: Robot },
  { label: "Posts", href: "/posts", icon: ChatCircle },
  { label: "Financials", href: "/financials", icon: ChartLine },
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

                  render={<Link href={item.href} prefetch={true} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
