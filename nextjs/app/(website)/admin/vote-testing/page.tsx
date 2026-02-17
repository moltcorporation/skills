import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { timeAgo } from "@/lib/format";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { FastForwardButton, CastVoteButtons, CreateTestVoteForm, Countdown } from "./actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "vote testing",
  description: "admin vote testing tools",
};

async function getVoteTestingData() {
  const supabase = createAdminClient();

  const [
    { data: activeTopics },
    { data: resolvedTopics },
    { data: products },
  ] = await Promise.all([
    supabase
      .from("vote_topics")
      .select("*, vote_options(*), products(id, name)")
      .is("resolved_at", null)
      .order("deadline", { ascending: true }),
    supabase
      .from("vote_topics")
      .select("*, vote_options(*), products(id, name)")
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(20),
    supabase.from("products").select("id, name").order("name"),
  ]);

  // Get vote counts
  const allTopicIds = [
    ...(activeTopics ?? []).map((t) => t.id),
    ...(resolvedTopics ?? []).map((t) => t.id),
  ];

  const votesMap: Record<string, Record<string, number>> = {};
  if (allTopicIds.length > 0) {
    const { data: allVotes } = await supabase
      .from("votes")
      .select("topic_id, option_id")
      .in("topic_id", allTopicIds);

    for (const v of allVotes ?? []) {
      if (!votesMap[v.topic_id]) votesMap[v.topic_id] = {};
      votesMap[v.topic_id][v.option_id] =
        (votesMap[v.topic_id][v.option_id] || 0) + 1;
    }
  }

  return {
    activeTopics: activeTopics ?? [],
    resolvedTopics: resolvedTopics ?? [],
    products: products ?? [],
    votesMap,
  };
}

async function VoteTestingContent() {
  const { activeTopics, resolvedTopics, products, votesMap } =
    await getVoteTestingData();

  return (
    <div className="py-4">
      <PageBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Vote Testing" },
        ]}
      />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Vote Testing</h1>
      <p className="text-muted-foreground mb-6">
        Test vote resolution workflows. Create votes, fast-forward deadlines,
        watch them resolve.
      </p>

      <CreateTestVoteForm products={products} />

      {/* Active Votes */}
      <h2 className="text-xl font-semibold mt-8 mb-4">
        Active Votes ({activeTopics.length})
      </h2>
      {activeTopics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No active votes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeTopics.map((topic) => {
            const options = (topic.vote_options ?? []) as {
              id: string;
              label: string;
            }[];
            const product = topic.products as unknown as { id: string; name: string } | null;
            const topicVotes = votesMap[topic.id] ?? {};
            const totalVotes = Object.values(topicVotes).reduce(
              (a, b) => a + b,
              0,
            );

            return (
              <Card key={topic.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">
                          {topic.title}
                        </h3>
                        <Countdown deadline={topic.deadline} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        </span>
                        <span>
                          Options:{" "}
                          {options
                            .map((o) => {
                              const count = topicVotes[o.id] || 0;
                              return `${o.label} (${count})`;
                            })
                            .join(", ")}
                        </span>
                        {product && (
                          <>
                            <span>&middot;</span>
                            <Link href={`/products/${product.id}`} className="text-primary hover:underline">
                              {product.name}
                            </Link>
                          </>
                        )}
                      </div>
                      {topic.on_resolve && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          on_resolve:{" "}
                          <code className="bg-muted px-1 rounded text-[10px]">
                            {JSON.stringify(topic.on_resolve)}
                          </code>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {topic.id}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <CastVoteButtons topicId={topic.id} options={options} />
                      <FastForwardButton topicId={topic.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolved Votes */}
      <h2 className="text-xl font-semibold mt-8 mb-4">
        Recently Resolved ({resolvedTopics.length})
      </h2>
      {resolvedTopics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No resolved votes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resolvedTopics.map((topic) => {
            const options = (topic.vote_options ?? []) as {
              id: string;
              label: string;
            }[];
            const product = topic.products as unknown as { id: string; name: string } | null;
            const topicVotes = votesMap[topic.id] ?? {};
            const totalVotes = Object.values(topicVotes).reduce(
              (a, b) => a + b,
              0,
            );

            return (
              <Card key={topic.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{topic.title}</h3>
                    <Badge
                      variant="secondary"
                      className="text-[10px] border-0 bg-green-500/15 text-green-500"
                    >
                      {topic.winning_option ?? "Resolved"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </span>
                    <span>
                      Options:{" "}
                      {options
                        .map((o) => {
                          const count = topicVotes[o.id] || 0;
                          return `${o.label} (${count})`;
                        })
                        .join(", ")}
                    </span>
                    <span>Resolved {timeAgo(topic.resolved_at)}</span>
                    {product && (
                      <>
                        <span>&middot;</span>
                        <Link href={`/products/${product.id}`} className="text-primary hover:underline">
                          {product.name}
                        </Link>
                      </>
                    )}
                  </div>
                  {topic.on_resolve && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      on_resolve:{" "}
                      <code className="bg-muted px-1 rounded text-[10px]">
                        {JSON.stringify(topic.on_resolve)}
                      </code>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {topic.id}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      }
    >
      <VoteTestingContent />
    </Suspense>
  );
}
