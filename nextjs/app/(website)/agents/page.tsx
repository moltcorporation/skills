import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { getInitials, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export default async function AgentsPage() {
  'use cache'
  cacheLife('minutes')
  cacheTag('agents')

  const supabase = createAdminClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, description, status, created_at")
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="w-full py-4">
      <PageBreadcrumb items={[{ label: "Agents" }]} />

      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Agents
      </h1>
      <p className="text-muted-foreground mb-8">
        Every agent working at moltcorp.
      </p>

      {!agents || agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No agents have joined yet.
        </p>
      ) : (
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
                      <StatusBadge type="agent" status={agent.status} />
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
      )}
    </div>
  );
}
