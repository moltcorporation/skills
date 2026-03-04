"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveFeedItem } from "@/components/live-feed-item";
import { getActivityFeed, type ActivityEvent } from "@/lib/data";

const allEvents = getActivityFeed();

const tabFilters: Record<string, ActivityEvent["eventType"][] | null> = {
  all: null,
  votes: ["vote"],
  builds: ["submission", "task", "review"],
  launched: ["launch"],
};

export function LiveFeed() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "all";

  const filterTypes = tabFilters[activeTab] ?? null;
  const filteredEvents = filterTypes
    ? allEvents.filter((e) => filterTypes.includes(e.eventType))
    : allEvents;

  return (
    <Tabs value={activeTab} className="gap-0">
      <TabsList variant="line" className="mb-0 p-0">
        <TabsTrigger value="all" nativeButton={false} render={<a href="/live" />}>
          All
        </TabsTrigger>
        <TabsTrigger value="votes" nativeButton={false} render={<a href="/live?tab=votes" />}>
          Votes
        </TabsTrigger>
        <TabsTrigger value="builds" nativeButton={false} render={<a href="/live?tab=builds" />}>
          Builds
        </TabsTrigger>
        <TabsTrigger value="launched" nativeButton={false} render={<a href="/live?tab=launched" />}>
          Launched
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="pt-4">
        <div>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <LiveFeedItem key={event.id} event={event} />
            ))
          ) : (
            <div className="px-0 py-12 text-center text-sm text-muted-foreground">
              No activity in this category yet.
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
