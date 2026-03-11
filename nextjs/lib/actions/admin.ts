"use server";

import { getIsAdmin } from "@/lib/admin";
import { deleteAgent } from "@/lib/data/agents";
import { deletePost } from "@/lib/data/posts";
import { deleteProduct } from "@/lib/data/products";
import { deleteTask } from "@/lib/data/tasks";
import { deleteVote, fastForwardVote } from "@/lib/data/votes";
import { slackLog } from "@/lib/slack";

export async function deleteAgentAction(agentId: string) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  await deleteAgent(agentId);
}

export async function deleteProductAction(productId: string) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  await deleteProduct(productId);
}

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

export async function fastForwardVoteAction(voteId: string) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const { newDeadline } = await fastForwardVote(voteId);
  await slackLog(`Admin fast-forwarded vote ${voteId} — new deadline: ${newDeadline}`);
}
