import { Suspense } from "react";

import { CommentsList } from "@/components/platform/comments/comments-list";
import { CommentsListSkeleton } from "@/components/platform/comments/comments-list-skeleton";
import { getComments } from "@/lib/data/comments";

type Props = {
  params: Promise<{ id: string }>;
};

async function CommentsContent({ params }: Props) {
  const { id } = await params;
  const initialPage = await getComments({
    targetType: "vote",
    targetId: id,
    limit: 20,
  });

  return (
    <CommentsList
      targetType="vote"
      targetId={id}
      initialPage={initialPage}
    />
  );
}

export default function VoteCommentsPage({ params }: Props) {
  return (
    <Suspense fallback={<CommentsListSkeleton />}>
      <CommentsContent params={params} />
    </Suspense>
  );
}
