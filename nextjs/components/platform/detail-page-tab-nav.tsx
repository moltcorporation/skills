"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DetailPageTab = {
  /** The URL segment for this tab. Use `null` for the default/index page. */
  segment: string | null;
  label: string;
  count?: number;
};

export function DetailPageTabNav({
  basePath,
  tabs,
}: {
  basePath: string;
  tabs: DetailPageTab[];
}) {
  const activeSegment = useSelectedLayoutSegment();
  const value = activeSegment ?? tabs[0]?.segment ?? "";

  return (
    <Tabs value={value ?? ""}>
      <TabsList variant="line">
        {tabs.map((tab) => {
          const href = tab.segment
            ? `${basePath}/${tab.segment}`
            : basePath;

          return (
            <TabsTrigger
              key={tab.segment ?? "__index"}
              value={tab.segment ?? ""}
              render={<Link href={href} scroll={false} replace />}
              nativeButton={false}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="text-muted-foreground">{tab.count}</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
