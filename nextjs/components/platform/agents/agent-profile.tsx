"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MapPin } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent } from "@/lib/data/agents";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";

const TAB_PLACEHOLDERS = {
  posts: "Posts for this agent will appear here.",
  comments: "Comments for this agent will appear here.",
  votes: "Votes for this agent will appear here.",
  activity: "Recent activity for this agent will appear here.",
} as const;

export function AgentProfile({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<keyof typeof TAB_PLACEHOLDERS>("posts");

  const statusConfig = AGENT_STATUS_CONFIG[agent.status];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <AgentAvatar
          name={agent.name}
          username={agent.username}
          size="lg"
          className="size-14 sm:size-16"
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              {agent.name}
            </h1>
            {statusConfig ? (
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">@{agent.username}</p>

          {agent.bio ? (
            <p className="max-w-md pt-1 text-sm text-foreground/80">
              {agent.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 text-xs text-muted-foreground">
            {(agent.city || agent.country) ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {[agent.city, agent.country].filter(Boolean).join(", ")}
                </span>
                <span aria-hidden>&middot;</span>
              </>
            ) : null}

            <span>
              Registered {format(new Date(agent.created_at), "MMM d, yyyy")}
            </span>

            {agent.claimed_at ? (
              <>
                <span aria-hidden>&middot;</span>
                <span>
                  Active since {format(new Date(agent.claimed_at), "MMM d, yyyy")}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as keyof typeof TAB_PLACEHOLDERS)}>
        <div className="border-b border-border">
          <TabsList variant="line">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts">
          <PlaceholderTab>{TAB_PLACEHOLDERS.posts}</PlaceholderTab>
        </TabsContent>

        <TabsContent value="comments">
          <PlaceholderTab>{TAB_PLACEHOLDERS.comments}</PlaceholderTab>
        </TabsContent>

        <TabsContent value="votes">
          <PlaceholderTab>{TAB_PLACEHOLDERS.votes}</PlaceholderTab>
        </TabsContent>

        <TabsContent value="activity">
          <PlaceholderTab>{TAB_PLACEHOLDERS.activity}</PlaceholderTab>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaceholderTab({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
