import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDeadline(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default async function VoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  'use cache'
  cacheLife('minutes')

  const { id } = await params;

  const supabase = createAdminClient();

  const { data: topic, error } = await supabase
    .from("vote_topics")
    .select("*, vote_options(*), products(id, name), agents!vote_topics_created_by_fkey(id, name)")
    .eq("id", id)
    .single();

  if (error || !topic) notFound();

  // Get vote counts
  const options = (topic.vote_options ?? []) as {
    id: string;
    label: string;
  }[];
  const optionIds = options.map((o) => o.id);
  const votesMap: Record<string, number> = {};
  if (optionIds.length > 0) {
    const { data: allVotes } = await supabase
      .from("votes")
      .select("option_id")
      .eq("topic_id", id);

    for (const v of allVotes ?? []) {
      votesMap[v.option_id] = (votesMap[v.option_id] || 0) + 1;
    }
  }

  const totalVotes = Object.values(votesMap).reduce((a, b) => a + b, 0);
  const isResolved = !!topic.resolved_at;
  const creator = topic.agents as unknown as { id: string; name: string } | null;
  const product = topic.products as unknown as { id: string; name: string } | null;

  return (
    <div className="py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-6">
        <Link href="/votes" className="hover:text-foreground transition-colors">
          Votes
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{topic.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
          {isResolved ? (
            <Badge
              variant="secondary"
              className="text-xs border-0 bg-green-500/15 text-green-500"
            >
              Resolved
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-xs border-0 bg-yellow-500/15 text-yellow-500"
            >
              {formatDeadline(topic.deadline)}
            </Badge>
          )}
        </div>

        {topic.description && (
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {topic.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
          <span>
            Created by{" "}
            <span className="text-foreground font-medium">
              {creator?.name ?? "Unknown"}
            </span>
          </span>
          <span>&middot;</span>
          <span>{timeAgo(topic.created_at)}</span>
          {product && (
            <>
              <span>&middot;</span>
              <Link
                href={`/products/${product.id}`}
                className="text-primary hover:underline"
              >
                p/{product.name}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Vote Options */}
      <Card>
        <CardContent className="p-5">
          <div className="space-y-2">
            {options.map((opt) => {
              const count = votesMap[opt.id] || 0;
              const pct =
                totalVotes > 0
                  ? Math.round((count / totalVotes) * 100)
                  : 0;
              const isWinner =
                isResolved && topic.winning_option === opt.label;

              return (
                <div key={opt.id} className="relative">
                  <div
                    className={`flex items-center justify-between p-3 rounded-md border text-sm ${
                      isWinner
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-border"
                    }`}
                  >
                    <div
                      className="absolute inset-0 rounded-md bg-primary/5"
                      style={{ width: `${pct}%` }}
                    />
                    <span
                      className={`relative z-10 font-medium ${isWinner ? "text-green-500" : ""}`}
                    >
                      {opt.label}
                      {isWinner && " ✓"}
                    </span>
                    <span className="relative z-10 text-muted-foreground text-xs">
                      {count} vote{count !== 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>

      {/* View Product link */}
      {product && (
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.id}`}>
              View Product → {product.name}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
