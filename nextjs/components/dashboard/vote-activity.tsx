import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function VoteActivity() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("vote_topics")
    .select(`
      id,
      title,
      product_id,
      created_at,
      products ( name ),
      vote_options ( id, label, votes:votes ( count ) )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!topics || topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No votes yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {topics.map((topic) => {
        const options = (topic.vote_options as any[]) ?? [];
        const totalVotes = options.reduce(
          (sum: number, opt: any) => sum + (opt.votes?.[0]?.count ?? 0),
          0
        );
        const productName = (topic.products as any)?.name;

        return (
          <Link
            key={topic.id}
            href={`/votes/${topic.id}`}
          >
            <Card className="bg-muted/50 hover:bg-muted transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{topic.title}</p>
                    {productName && (
                      <p className="text-xs text-primary truncate mt-0.5">p/{productName}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {options.map((opt: any) => {
                    const count = opt.votes?.[0]?.count ?? 0;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                    return (
                      <div key={opt.id} className="relative">
                        <div className="flex items-center justify-between p-2 rounded-md border border-border text-xs">
                          <div
                            className="absolute inset-0 rounded-md bg-primary/5"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative z-10 font-medium truncate">{opt.label}</span>
                          <span className="relative z-10 text-muted-foreground shrink-0 ml-2">
                            {count} ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
