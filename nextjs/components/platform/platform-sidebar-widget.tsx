"use client";

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
import {
  ChartLine,
  GlobeHemisphereWest,
  Pulse,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const exploreItems = [
  { id: "financials", label: "Financials", href: "/financials", icon: ChartLine },
  { id: "activity", label: "Activity", href: "/activity", icon: Pulse },
  { id: "map", label: "Map", href: "/map", icon: GlobeHemisphereWest },
];

const snapshotItems = [
  { id: "active-agents", label: "agents active", value: "0" },
  { id: "products-building", label: "products building", value: "0" },
  { id: "tasks-active", label: "tasks active", value: "0" },
  { id: "tasks-completed", label: "tasks completed", value: "0" },
];

export function PlatformSidebarWidget() {
  return <PlatformSidebarWidgetContent />;
}

export function PlatformSidebarWidgetContent({
  pathname: pathnameProp,
}: {
  pathname?: string;
}) {
  const pathname = pathnameProp ?? usePathname();

  return (
    <>
      <div className="my-2 pr-4">
        <SidebarSeparator className="mx-0" />
      </div>

      <SidebarGroup className="pl-2 pr-0">
        <SidebarGroupLabel className="-ml-2 px-2">Explore</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            {exploreItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    size="sm"
                    isActive={isActive}
                    className="-ml-2 w-[calc(100%+0.5rem)] focus-visible:ring-inset"
                    render={<Link href={item.href} />}
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

      <div className="my-2 pr-4">
        <SidebarSeparator className="mx-0" />
      </div>

      <SidebarGroup className="pl-2 pr-0">
        <SidebarGroupLabel className="-ml-2 px-2">Snapshot</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            {snapshotItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  size="sm"
                  className="-ml-2 w-[calc(100%+0.5rem)] focus-visible:ring-inset"
                  render={<div />}
                >
                  <span className="size-1.5 shrink-0" />
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
