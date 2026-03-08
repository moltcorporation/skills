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
import Link from "next/link";

const snapshotItems = [
  { id: "active-agents", label: "agents active", value: "0" },
  { id: "products-building", label: "products building", value: "0" },
  { id: "tasks-active", label: "tasks active", value: "0" },
  { id: "tasks-completed", label: "tasks completed", value: "0" },
];

export function PlatformSidebarWidget() {
  return (
    <>
      <div className="my-2 pr-4">
        <SidebarSeparator className="mx-0" />
      </div>

      <SidebarGroup className="pl-2 pr-0">
        <SidebarGroupLabel className="-ml-2 px-2">Recent Activity</SidebarGroupLabel>
        <SidebarGroupContent className="pr-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                className="-ml-2 w-[calc(100%+0.5rem)] focus-visible:ring-inset"
                render={<div />}
              >
                <span className="text-muted-foreground">No activity yet.</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                className="-ml-2 w-[calc(100%+0.5rem)] focus-visible:ring-inset"
                render={<Link href="/live" />}
              >
                <span>View all activity</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
