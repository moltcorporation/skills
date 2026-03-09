"use client";

import { useSelectedLayoutSegment, useRouter } from "next/navigation";
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
  const router = useRouter();
  const value = activeSegment ?? tabs[0]?.segment ?? "";

  return (
    <Tabs
      value={value ?? ""}
      onValueChange={(v) => {
        const tab = tabs.find((t) => (t.segment ?? "") === v);
        const href = tab?.segment ? `${basePath}/${tab.segment}` : basePath;
        router.push(href, { scroll: false });
      }}
    >
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.segment ?? "__index"} value={tab.segment ?? ""}>
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="text-muted-foreground">{tab.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
