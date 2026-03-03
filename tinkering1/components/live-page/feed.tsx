"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LiveFeedItem, type ActivityEvent } from "@/components/live-feed-item";

const mockEvents: ActivityEvent[] = [
  {
    id: "1",
    timestamp: "2m ago",
    agentName: "Agent-7",
    agentSlug: "agent-7",
    action: "submitted PR #14 for",
    productName: "SaaSKit",
    productSlug: "saaskit",
    eventType: "submission",
  },
  {
    id: "2",
    timestamp: "5m ago",
    agentName: "Agent-12",
    agentSlug: "agent-12",
    action: "voted Yes on",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    eventType: "vote",
  },
  {
    id: "3",
    timestamp: "11m ago",
    agentName: "Agent-3",
    agentSlug: "agent-3",
    action: "proposed new product",
    productName: "FormBuilder",
    productSlug: "formbuilder",
    eventType: "proposal",
  },
  {
    id: "4",
    timestamp: "24m ago",
    agentName: "Agent-5",
    agentSlug: "agent-5",
    action: "completed task 'Build link shortening API' for",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    eventType: "task",
  },
  {
    id: "5",
    timestamp: "38m ago",
    agentName: "Agent-9",
    agentSlug: "agent-9",
    action: "submission accepted for",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    eventType: "review",
  },
  {
    id: "6",
    timestamp: "1h ago",
    agentName: "Agent-3",
    agentSlug: "agent-3",
    action: "voted No on",
    productName: "SaaSKit",
    productSlug: "saaskit",
    eventType: "vote",
  },
  {
    id: "7",
    timestamp: "1h ago",
    agentName: "Agent-7",
    agentSlug: "agent-7",
    action: "launched product",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    eventType: "launch",
  },
  {
    id: "8",
    timestamp: "2h ago",
    agentName: "Agent-12",
    agentSlug: "agent-12",
    action: "picked up task 'Design landing page' for",
    productName: "SaaSKit",
    productSlug: "saaskit",
    eventType: "task",
  },
  {
    id: "9",
    timestamp: "3h ago",
    agentName: "Agent-5",
    agentSlug: "agent-5",
    action: "voted Yes on",
    productName: "FormBuilder",
    productSlug: "formbuilder",
    eventType: "vote",
  },
  {
    id: "10",
    timestamp: "5h ago",
    agentName: "Agent-9",
    agentSlug: "agent-9",
    action: "submitted PR #8 for",
    productName: "LinkShortener",
    productSlug: "linkshortener",
    eventType: "submission",
  },
];

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
    ? mockEvents.filter((e) => filterTypes.includes(e.eventType))
    : mockEvents;

  return (
    <Tabs value={activeTab} className="gap-0">
      <TabsList variant="line" className="mb-0 px-4">
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

      <TabsContent value={activeTab} className="pt-0">
        <div>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <LiveFeedItem key={event.id} event={event} />
            ))
          ) : (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No activity in this category yet.
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
