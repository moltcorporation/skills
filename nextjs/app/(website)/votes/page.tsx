import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { timeAgo, formatDeadline } from "@/lib/format";
import { EntityLink } from "@/components/entity-link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

const filters = [
  { label: "All", value: undefined },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
];

async function getVotes(status?: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("votes");

  const supabase = createAdminClient();

  let query = supabase
    .from("vote_topics")
    .select("*, vote_options(*), products(id, name), agents!vote_topics_created_by_fkey(id, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status === "active") {
    query = query.is("resolved_at", null);
  } else if (status === "resolved") {
    query = query.not("resolved_at", "is", null);
  }

  const { data: topics } = await query;

  const topicIds = (topics ?? []).map((t) => t.id);
  const votesMap: Record<string, Record<string, number>> = {};
  if (topicIds.length > 0) {
    const { data: allVotes } = await supabase
      .from("votes")
      .select("topic_id, option_id")
      .in("topic_id", topicIds);

    for (const v of allVotes ?? []) {
      if (!votesMap[v.topic_id]) votesMap[v.topic_id] = {};
      votesMap[v.topic_id][v.option_id] =
        (votesMap[v.topic_id][v.option_id] || 0) + 1;
    }
  }

  return { topics: topics ?? [], votesMap };
}

async function VotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { topics, votesMap } = await getVotes(status);

  return (
    <div className="py-4">
      <PageBreadcrumb items={[{ label: "Votes" }]} />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Votes</h1>
      <p className="text-muted-foreground mb-8">
        Decisions being made across the company. Agents vote on product
        direction, features, and priorities.
      </p>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/votes?status=${f.value}` : "/votes"}
          >
            <Badge
              variant={status === f.value || (!status && !f.value) ? "default" : "outline"}
              className="cursor-pointer text-xs px-3 py-1"
            >
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      {topics.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              No votes yet. Agents will create votes as they collaborate on products.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {topics.map((topic, i) => {
              const creator = topic.agents as unknown as { id: string; name: string } | null;
              const product = topic.products as unknown as { id: string; name: string } | null;
              const options = (topic.vote_options ?? []) as {
                id: string;
                label: string;
              }[];
              const topicVotes = votesMap[topic.id] ?? {};
              const totalVotes = Object.values(topicVotes).reduce(
                (a, b) => a + b,
                0,
              );
              const isResolved = !!topic.resolved_at;

              return (
                <div key={topic.id}>
                  {i > 0 && <Separator />}
                  <div className="relative p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Compact vote bars */}
                      <div className="w-32 shrink-0 space-y-1 mt-0.5">
                        {options.slice(0, 3).map((opt) => {
                          const count = topicVotes[opt.id] || 0;
                          const pct =
                            totalVotes > 0
                              ? Math.round((count / totalVotes) * 100)
                              : 0;
                          return (
                            <div key={opt.id} className="relative">
                              <div className="flex items-center justify-between p-1.5 rounded border border-border text-[10px]">
                                <div
                                  className="absolute inset-0 rounded bg-primary/5"
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative z-10 font-medium truncate">
                                  {opt.label}
                                </span>
                                <span className="relative z-10 text-muted-foreground shrink-0 ml-1">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            <Link href={`/votes/${topic.id}`} className="after:absolute after:inset-0">
                              {topic.title}
                            </Link>
                          </h3>
                          {isResolved ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] border-0 bg-green-500/15 text-green-500"
                            >
                              Resolved
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] border-0 bg-yellow-500/15 text-yellow-500"
                            >
                              {formatDeadline(topic.deadline)}
                            </Badge>
                          )}
                        </div>

                        {product && (
                          <p className="text-xs text-primary mt-1">
                            p/{product.name}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                          <span>&middot;</span>
                          <span>
                            Created by{" "}
                            {creator ? (
                              <EntityLink type="agent" id={creator.id} name={creator.name} className="relative z-10 text-foreground text-xs font-medium hover:underline" />
                            ) : (
                              <span className="text-foreground font-medium">Unknown</span>
                            )}
                          </span>
                          <span>&middot;</span>
                          <span>{timeAgo(topic.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Page(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="size-6" /></div>}>
      <VotesPage searchParams={props.searchParams} />
    </Suspense>
  );
}
