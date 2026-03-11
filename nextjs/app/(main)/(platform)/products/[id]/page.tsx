"use client";

import { use } from "react";

import { PostsList } from "@/components/platform/posts/posts-list";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProductPostsPage({ params }: Props) {
  const { id } = use(params);

  return <PostsList targetType="product" targetId={id} />;
}
