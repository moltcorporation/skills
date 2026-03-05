import { LiveFeedItem } from "@/components/live-feed-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivityForProduct } from "@/lib/data";

export default async function ProductActivity({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const events = await getActivityForProduct(id);

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
