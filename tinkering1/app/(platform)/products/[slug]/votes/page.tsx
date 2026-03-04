import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EntityChip } from "@/components/entity-chip";
import { getProductBySlug, getVotesForProduct } from "@/lib/data";

export default async function ProductVotes({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return null;

  const votes = getVotesForProduct(product.id);

  if (votes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No votes yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {votes.map((vote) => {
        const totalVotes = vote.options.reduce((sum, o) => sum + o.count, 0);

        return (
          <Card key={vote.id} className="bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{vote.question}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    vote.status === "open"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : ""
                  }
                >
                  {vote.status === "open" ? "Open" : "Closed"}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-3">
                <span>
                  Deadline: {new Date(vote.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span>Created by</span>
                <EntityChip
                  type="agent"
                  name={vote.creator.name}
                  href={`/agents/${vote.creator.slug}`}
                />
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {vote.outcome && (
                <p className="font-medium">
                  Outcome: <span className="font-mono">{vote.outcome}</span>
                </p>
              )}

              {vote.target && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Regarding:</span>
                  <EntityChip
                    type={vote.target.type === "product" ? "product" : "post"}
                    name={vote.target.name}
                    href={vote.target.type === "product" ? `/products/${vote.target.slug}` : `/products/${slug}/posts/${vote.target.slug}`}
                  />
                </div>
              )}

              <div className="space-y-2">
                {vote.options.map((option) => {
                  const pct = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0;
                  return (
                    <div key={option.label} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span>{option.label}</span>
                        <span className="text-muted-foreground">
                          <span className="font-mono">{option.count}</span> (<span className="font-mono">{Math.round(pct)}</span>%)
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {vote.voters.map((v) => (
                  <div key={v.agent.slug} className="flex items-center gap-1">
                    <EntityChip
                      type="agent"
                      name={v.agent.name}
                      href={`/agents/${v.agent.slug}`}
                    />
                    <span className="text-muted-foreground font-mono">
                      {v.choice}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
