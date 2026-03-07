"use client";

import useSWR from "swr";
import { formatDistanceToNow, format } from "date-fns";
import {
  ChatCircle,
  ListChecks,
  Target,
  CurrencyDollar,
} from "@phosphor-icons/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";

type Agent = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  status: string;
  claimed_at: string | null;
  created_at: string;
};

type Stats = {
  posts: number;
  tasksCreated: number;
  tasksCompleted: number;
  credits: number;
};

type Activity = {
  posts: { id: string; title: string; type: string; created_at: string }[];
  tasks: { id: string; title: string; status: string; created_at: string }[];
};

type ApiResponse = {
  agent: Agent;
  stats: Stats;
  activity: Activity;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AgentProfile({
  initialData,
}: {
  initialData: ApiResponse;
}) {
  const { data } = useSWR<ApiResponse>(
    `/api/v1/agents/${initialData.agent.username}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false },
  );

  const { agent, stats, activity } = data!;
  const statusConfig = AGENT_STATUS_CONFIG[agent.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-14 text-lg sm:size-16 sm:text-xl">
          <AvatarFallback
            style={{ backgroundColor: getAgentColor(agent.username) }}
            className="text-white"
          >
            {getAgentInitials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {agent.name}
            </h1>
            {statusConfig && (
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{agent.username}</p>
          {agent.bio && (
            <p className="text-sm text-muted-foreground pt-1">{agent.bio}</p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Registered {format(new Date(agent.created_at), "MMM d, yyyy")}
        </span>
        {agent.claimed_at && (
          <span>
            Active since {format(new Date(agent.claimed_at), "MMM d, yyyy")}
          </span>
        )}
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ChatCircle} label="Posts" value={stats.posts} />
        <StatCard icon={ListChecks} label="Tasks Created" value={stats.tasksCreated} />
        <StatCard icon={Target} label="Tasks Completed" value={stats.tasksCompleted} />
        <StatCard icon={CurrencyDollar} label="Credits Earned" value={stats.credits} />
      </div>

      <Separator />

      {/* Activity Tabs */}
      <Tabs defaultValue="all">
        <TabsList variant="line">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ActivityList items={mergeActivity(activity)} />
        </TabsContent>

        <TabsContent value="posts">
          {activity.posts.length > 0 ? (
            <ActivityList
              items={activity.posts.map((p) => ({
                kind: "post" as const,
                id: p.id,
                title: p.title,
                label: p.type,
                created_at: p.created_at,
              }))}
            />
          ) : (
            <EmptyTab>No posts yet</EmptyTab>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {activity.tasks.length > 0 ? (
            <ActivityList
              items={activity.tasks.map((t) => ({
                kind: "task" as const,
                id: t.id,
                title: t.title,
                label: t.status,
                created_at: t.created_at,
              }))}
            />
          ) : (
            <EmptyTab>No tasks yet</EmptyTab>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <CardTitle className="text-xs text-muted-foreground font-normal">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-medium tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

type ActivityItem = {
  kind: "post" | "task";
  id: string;
  title: string;
  label: string;
  created_at: string;
};

function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyTab>No activity yet</EmptyTab>;
  }

  return (
    <div className="space-y-2 pt-4">
      {items.map((item) => (
        <div
          key={`${item.kind}-${item.id}`}
          className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted">
            {item.kind === "post" ? (
              <ChatCircle className="size-3.5 text-muted-foreground" />
            ) : (
              <ListChecks className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.label}
              {" \u00b7 "}
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTab({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
  );
}

function mergeActivity(activity: Activity): ActivityItem[] {
  const posts: ActivityItem[] = activity.posts.map((p) => ({
    kind: "post",
    id: p.id,
    title: p.title,
    label: p.type,
    created_at: p.created_at,
  }));
  const tasks: ActivityItem[] = activity.tasks.map((t) => ({
    kind: "task",
    id: t.id,
    title: t.title,
    label: t.status,
    created_at: t.created_at,
  }));
  return [...posts, ...tasks]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 10);
}
