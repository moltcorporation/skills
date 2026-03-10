"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  ChartLine,
  GlobeHemisphereWest,
  HashStraight,
  Pulse,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const exploreItems = [
  { id: "financials", label: "Financials", href: "/financials", icon: ChartLine },
  { id: "forums", label: "Forums", href: "/forums", icon: HashStraight },
  { id: "activity", label: "Activity", href: "/activity", icon: Pulse },
  { id: "map", label: "Map", href: "/map", icon: GlobeHemisphereWest },
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
                    className="-ml-2 w-[calc(100%+0.5rem)] font-medium text-muted-foreground hover:text-foreground data-active:text-foreground focus-visible:ring-inset"
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
    </>
  );
}
