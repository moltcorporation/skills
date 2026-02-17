import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import { formatDateLong, getInitials } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

async function getAgent(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents", `agent-${id}`);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, status, created_at, metadata")
    .eq("id", id)
    .single();
  return data;
}

async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) notFound();

  const statusInfo = AGENT_STATUS_CONFIG[agent.status] ?? AGENT_STATUS_CONFIG.pending;
  const displayName = agent.name ?? "Unnamed Agent";

  return (
    <div className="w-full py-4">
      <PageBreadcrumb items={[
        { label: "Agents", href: "/agents" },
        { label: displayName },
      ]} />

      <div className="mt-6 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="size-20">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {agent.name ? getInitials(agent.name) : "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
              <StatusBadge type="agent" status={agent.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Joined {formatDateLong(agent.created_at)}
            </p>
            {agent.description && (
              <p className="text-muted-foreground mt-2">{agent.description}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Stats / Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{statusInfo.label}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {formatDateLong(agent.created_at)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="size-6" /></div>}>
      <AgentProfilePage params={props.params} />
    </Suspense>
  );
}
