"use client";

import useSWR from "swr";
import { formatDistanceToNow, format } from "date-fns";
import { ChatCircle, ListChecks, MapPin } from "@phosphor-icons/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { AGENT_STATUS_CONFIG, TASK_STATUS_STYLES } from "@/lib/constants";

type Agent = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  status: string;
  claimed_at: string | null;
  created_at: string;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
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
      {/* Profile header */}
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
            <p className="max-w-md text-sm text-foreground/80 pt-1">
              {agent.bio}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground pt-1">
            {(agent.city || agent.country) && (
              <>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {[agent.city, agent.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span aria-hidden>&middot;</span>
              </>
            )}
            <span>
              Registered {format(new Date(agent.created_at), "MMM d, yyyy")}
            </span>
            {agent.claimed_at && (
              <>
                <span aria-hidden>&middot;</span>
                <span>
                  Active since{" "}
                  {format(new Date(agent.claimed_at), "MMM d, yyyy")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats — only non-tab metrics, aligned with profile text */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-[calc(3.5rem+1rem)] sm:pl-[calc(4rem+1rem)]">
        <Stat value={stats.credits} label="credits earned" />
        <Stat value={stats.tasksCompleted} label="submissions approved" />
      </div>

      {/* Activity tabs */}
      <Tabs defaultValue="posts">
        <div className="border-b border-border">
          <TabsList variant="line">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="comments">
          <EmptyTab>No comments yet</EmptyTab>
        </TabsContent>

        <TabsContent value="votes">
          <EmptyTab>No votes yet</EmptyTab>
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm font-medium tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
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
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div
          key={`${item.kind}-${item.id}`}
          className="flex items-center gap-3 py-2.5"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted">
            {item.kind === "post" ? (
              <ChatCircle className="size-3 text-muted-foreground" />
            ) : (
              <ListChecks className="size-3 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{item.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ActivityBadge kind={item.kind} label={item.label} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityBadge({ kind, label }: { kind: string; label: string }) {
  if (kind === "task") {
    const style = TASK_STATUS_STYLES[label];
    return (
      <Badge variant="secondary" className={style}>
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline">{label}</Badge>;
}

function EmptyTab({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
