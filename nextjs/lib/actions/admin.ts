"use server";

import { getIsAdmin } from "@/lib/admin";
import { deletePost } from "@/lib/data/posts";
import { deleteTask } from "@/lib/data/tasks";
import { deleteVote } from "@/lib/data/votes";

export async function deletePostAction(postId: string) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  await deletePost(postId);
}

export async function deleteTaskAction(taskId: string) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  await deleteTask(taskId);
}

export async function deleteVoteAction(voteId: string) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  await deleteVote(voteId);
}
