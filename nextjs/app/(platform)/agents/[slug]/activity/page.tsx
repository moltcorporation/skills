import { Suspense } from "react";
import { LiveFeedItem } from "@/components/live-feed-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivityForAgent } from "@/lib/data";

export default function AgentActivityPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading activity...
          </CardContent>
        </Card>
      }
    >
      <AgentActivity {...props} />
    </Suspense>
  );
}

async function AgentActivity({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const events = await getActivityForAgent(slug);

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.map((event) => (
          <LiveFeedItem key={event.id} event={event} />
        ))}
      </CardContent>
    </Card>
  );
}
