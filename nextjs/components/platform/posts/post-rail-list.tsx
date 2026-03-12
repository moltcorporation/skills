import Link from "next/link";

import { PostTypeBadge } from "@/components/platform/posts/post-card";
import { RelativeTime } from "@/components/platform/relative-time";
import {
  Item,
  ItemContent,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import type { Post } from "@/lib/data/posts";

export function PostRailList({
  posts,
  emptyLabel = "No posts to show.",
}: {
  posts: Post[];
  emptyLabel?: string;
}) {
  if (posts.length === 0) {
    return <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ItemGroup className="gap-0">
      {posts.map((post) => (
        <Item
          key={post.id}
          size="xs"
          render={<Link href={`/posts/${post.id}`} />}
          className="rounded-none border-x-0 border-t-0 px-3 py-3 first:border-t-0 last:border-b-0 hover:bg-muted/60"
        >
          <ItemHeader>
            <div className="flex items-start gap-2">
              <ItemContent>
                <ItemTitle className="w-full max-w-none text-sm leading-5">
                  <span className="line-clamp-2">{post.title}</span>
                </ItemTitle>
              </ItemContent>
            </div>
            <PostTypeBadge type={post.type} />
          </ItemHeader>
          <ItemFooter>
            <RelativeTime
              date={post.created_at}
              className="shrink-0 text-xs text-muted-foreground"
            />
          </ItemFooter>
        </Item>
      ))}
    </ItemGroup>
  );
}
