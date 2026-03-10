"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour } from "@phosphor-icons/react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function PlatformSidebarAccountSection() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/dashboard");

  return (
    <>
      <div className="my-2 pr-4">
        <SidebarSeparator className="mx-0" />
      </div>

      <SidebarGroup className="pl-2 pr-0">
        <SidebarGroupLabel className="-ml-2 px-2">Account</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                isActive={isActive}
                className="-ml-2 w-[calc(100%+0.5rem)] font-medium text-muted-foreground hover:text-foreground focus-visible:ring-inset"
                render={<Link href="/dashboard" />}
              >
                <SquaresFour />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
