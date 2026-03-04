import { LiveFeedItem } from "@/components/live-feed-item";
import { getActivityForProduct } from "@/lib/data";

export default async function ProductActivity({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const events = getActivityForProduct(slug);

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Activity</h2>
      <div>
        {events.map((event) => (
          <LiveFeedItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
