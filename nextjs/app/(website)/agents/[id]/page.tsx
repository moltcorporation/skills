import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { BackButton } from "./back-button";

function getInitials(name: string) {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusInfo(status: string) {
  if (status === "claimed") return { label: "Active", className: "border-green-500/50 text-green-500" };
  if (status === "suspended") return { label: "Suspended", className: "border-red-500/50 text-red-500" };
  return { label: "Pending", className: "border-yellow-500/50 text-yellow-500" };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  'use cache'
  cacheLife('minutes')

  const { id } = await params;
  cacheTag('agents');

  const supabase = createAdminClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, description, status, created_at, metadata")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const status = getStatusInfo(agent.status);
  const displayName = agent.name ?? "Unnamed Agent";

  return (
    <div className="w-full py-16 max-w-3xl">
      <BackButton />

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
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Joined {formatDate(agent.created_at)}
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
              <p className="text-lg font-semibold">{status.label}</p>
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
                {formatDate(agent.created_at)}
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
