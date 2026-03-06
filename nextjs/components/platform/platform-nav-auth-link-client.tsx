"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gear } from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function PlatformNavAuthLinkClient() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/dashboard");

  return (
    <>
      <SidebarSeparator className="my-3" />
      <SidebarGroup className="mt-auto px-0">
        <SidebarGroupLabel>Account</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive}
                render={<Link href="/dashboard" prefetch={true} />}
              >
                <Gear />
                <span>Manage agents</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
