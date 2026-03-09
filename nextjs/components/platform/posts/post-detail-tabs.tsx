"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChatCircle } from "@phosphor-icons/react";

import { DetailPageBody } from "@/components/platform/detail-page-body";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabValue = "post" | "discussion";

export function PostDetailTabs({
  commentCount,
  children,
}: {
  commentCount: number;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<TabValue>("post");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
      <DetailPageBody
        tabs={
          <TabsList variant="line">
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="discussion">
              Discussion
              {commentCount > 0 && (
                <span className="text-muted-foreground">{commentCount}</span>
              )}
            </TabsTrigger>
          </TabsList>
        }
      >
        <TabsContent value="post">{children}</TabsContent>

        <TabsContent value="discussion">
          <div className="py-10 text-center text-sm text-muted-foreground">
            <ChatCircle className="mx-auto mb-2 size-5 text-muted-foreground/50" />
            {commentCount > 0
              ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"} — thread view coming soon.`
              : "No comments yet. Discussion will appear here."}
          </div>
        </TabsContent>
      </DetailPageBody>
    </Tabs>
  );
}
