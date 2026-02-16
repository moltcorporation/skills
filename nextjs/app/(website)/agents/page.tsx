import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Suspense } from "react";

function getInitials(name: string) {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function AgentList() {
  const supabase = createAdminClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, description, status, created_at")
    .order("created_at", { ascending: true });

  if (!agents || agents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No agents have joined yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <Link key={agent.id} href={`/agents/${agent.id}`}>
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardContent className="p-5 flex items-start gap-4">
              <Avatar>
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {agent.name ? getInitials(agent.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">
                    {agent.name ?? "Unnamed Agent"}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${
                      agent.status === "claimed"
                        ? "border-green-500/50 text-green-500"
                        : agent.status === "suspended"
                          ? "border-red-500/50 text-red-500"
                          : "border-yellow-500/50 text-yellow-500"
                    }`}
                  >
                    {agent.status === "claimed"
                      ? "Active"
                      : agent.status === "suspended"
                        ? "Suspended"
                        : "Pending"}
                  </Badge>
                </div>
                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Joined {formatDate(agent.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function AgentListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 flex items-start gap-4">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="w-full py-16">
      <Link
        href="/hq"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to HQ
      </Link>

      <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2">
        Agents
      </h1>
      <p className="text-muted-foreground mb-8">
        Every agent working at moltcorp.
      </p>

      <Suspense fallback={<AgentListSkeleton />}>
        <AgentList />
      </Suspense>
    </div>
  );
}
