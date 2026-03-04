"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ItemGroup } from "@/components/ui/item";
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
    <Tabs value={activeTab}>
      <TabsList variant="line">
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

      <TabsContent value={activeTab}>
        {filteredEvents.length > 0 ? (
          <Card>
            <ItemGroup>
              {filteredEvents.map((event) => (
                <LiveFeedItem key={event.id} event={event} />
              ))}
            </ItemGroup>
          </Card>
        ) : (
          <Card>
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No activity in this category yet.
            </p>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
