"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

import { getIsAdmin } from "@/lib/admin";
import { deleteAgent } from "@/lib/data/agents";
import { upsertAnnouncement } from "@/lib/data/announcements";
import { getMemory, upsertMemory } from "@/lib/data/memories";
import { deletePost } from "@/lib/data/posts";
import { deleteProduct } from "@/lib/data/products";
import { deleteTask } from "@/lib/data/tasks";
import { deleteVote, fastForwardVote } from "@/lib/data/votes";
import { platformConfig } from "@/lib/platform-config";
import { slackLog } from "@/lib/slack";

const UpdateMemorySchema = z.object({
  targetType: z.enum(["product", "company"]),
  targetId: z.string().trim().min(1),
  body: z.string().trim().min(1).max(platformConfig.contentLimits.postBody),
});

const UpdateAnnouncementSchema = z.object({
  targetType: z.enum(["product", "company"]),
  targetId: z.string().trim().min(1),
  body: z.string().trim().min(1).max(platformConfig.contentLimits.postBody),
});

export type UpdateMemoryActionState = {
  error: string | null;
  success: boolean;
};

export type UpdateAnnouncementActionState = {
  error: string | null;
  success: boolean;
};

function revalidateAdminTarget(targetType: "product" | "company", targetId: string) {
  if (targetType === "product") {
    revalidateTag(`product-${targetId}`, "max");
  } else {
    revalidatePath("/dashboard");
  }
}

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

export async function updateMemoryAction(
  _prevState: UpdateMemoryActionState,
  formData: FormData,
): Promise<UpdateMemoryActionState> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return {
      error: "Unauthorized.",
      success: false,
    };
  }

  const parsed = UpdateMemorySchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid memory value.",
      success: false,
    };
  }

  try {
    const wordCount = parsed.data.body.trim().split(/\s+/).length;
    if (wordCount > platformConfig.memory.maxWords) {
      return {
        error: `Memory exceeds ${platformConfig.memory.maxWords}-word limit (currently ${wordCount} words). Compact the memory or shorten it without losing critical information.`,
        success: false,
      };
    }

    const current = await getMemory(parsed.data.targetType, parsed.data.targetId);

    if (current === null) {
      return {
        error: "Memory entry not found.",
        success: false,
      };
    }

    await upsertMemory({
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      body: parsed.data.body,
    });

    revalidateAdminTarget(parsed.data.targetType, parsed.data.targetId);

    return {
      error: null,
      success: true,
    };
  } catch (err) {
    console.error("[admin.updateMemory]", err);
    return {
      error: "Unable to save changes right now.",
      success: false,
    };
  }
}

export async function updateAnnouncementAction(
  _prevState: UpdateAnnouncementActionState,
  formData: FormData,
): Promise<UpdateAnnouncementActionState> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return {
      error: "Unauthorized.",
      success: false,
    };
  }

  const parsed = UpdateAnnouncementSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid announcement value.",
      success: false,
    };
  }

  try {
    await upsertAnnouncement({
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      body: parsed.data.body,
    });

    revalidateAdminTarget(parsed.data.targetType, parsed.data.targetId);

    return {
      error: null,
      success: true,
    };
  } catch (err) {
    console.error("[admin.updateAnnouncement]", err);
    return {
      error: "Unable to save changes right now.",
      success: false,
    };
  }
}
