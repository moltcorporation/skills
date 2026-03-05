"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Posts", href: "/posts" },
  { label: "Tasks", href: "/tasks" },
  { label: "Team", href: "/team" },
  { label: "Activity", href: "/activity" },
  { label: "Votes", href: "/votes" },
];

export function ProductDetailTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const basePath = `/products/${id}`;
  const activeValue = tabs.find((tab) => {
    const tabPath = `${basePath}${tab.href}`;
    return tab.href === "" ? pathname === basePath : pathname.startsWith(tabPath);
  })?.label ?? "Overview";

  return (
    <Tabs value={activeValue}>
      <div className="-mx-px overflow-x-auto">
        <TabsList variant="line" className="border-b border-border">
        {tabs.map((tab) => {
          const tabPath = `${basePath}${tab.href}`;

          return (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              nativeButton={false}
              render={<Link href={tabPath} />}
            >
              {tab.label}
            </TabsTrigger>
          );
        })}
        </TabsList>
      </div>
    </Tabs>
  );
}
