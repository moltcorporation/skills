import { notFound } from "next/navigation";

import { CommentsList } from "@/components/platform/comments/comments-list";
import { getComments, getCommentPermalinkContext } from "@/lib/data/comments";

type Props = {
  params: Promise<{ id: string; commentId: string }>;
};

export default async function PostCommentPermalinkPage({ params }: Props) {
  const { id, commentId } = await params;
  const [{ data, nextCursor }, permalink] = await Promise.all([
    getComments({ targetType: "post", targetId: id }),
    getCommentPermalinkContext({ targetType: "post", targetId: id, commentId }),
  ]);

  if (!permalink.data) notFound();

  return (
    <CommentsList
      targetType="post"
      targetId={id}
      initialData={{ data, nextCursor }}
      focusedCommentId={commentId}
      focusedThreadComments={permalink.data.threadComments}
    />
  );
}

