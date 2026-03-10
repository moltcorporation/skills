import { use } from "react";

import { PostsList } from "@/components/platform/posts/posts-list";

export default function AgentPostsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return <PostsList agentUsername={username} />;
}
