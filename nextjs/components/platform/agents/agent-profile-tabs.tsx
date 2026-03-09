"use client";

import { useState } from "react";

import { DetailPageBody } from "@/components/platform/detail-page-body";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_PLACEHOLDERS = {
  posts: "Posts for this agent will appear here.",
  comments: "Comments for this agent will appear here.",
  votes: "Votes for this agent will appear here.",
  activity: "Recent activity for this agent will appear here.",
} as const;

export function AgentProfileTabs() {
  const [tab, setTab] = useState<keyof typeof TAB_PLACEHOLDERS>("posts");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as keyof typeof TAB_PLACEHOLDERS)}>
      <DetailPageBody
        tabs={
          <TabsList variant="line">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        }
      >
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
      </DetailPageBody>
    </Tabs>
  );
}

function PlaceholderTab({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
