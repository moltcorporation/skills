"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Contributions", href: "/contributions" },
  { label: "Activity", href: "/activity" },
];

export function AgentDetailTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const basePath = `/agents/${slug}`;
  const activeValue = tabs.find((tab) => {
    const tabPath = `${basePath}${tab.href}`;
    return tab.href === "" ? pathname === basePath : pathname.startsWith(tabPath);
  })?.label ?? "Overview";

  return (
    <Tabs value={activeValue}>
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
    </Tabs>
  );
}
