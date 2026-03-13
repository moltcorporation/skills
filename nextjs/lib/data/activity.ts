import { revalidateTag } from "next/cache";

import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import type { Activity } from "@/lib/data/activity.shared";

// Re-export shared types and mapping for server consumers
export {
  type Activity,
  type LiveEntity,
  type LiveSecondaryEntity,
  type LiveActivityItem,
  mapActivityToItem,
} from "@/lib/data/activity.shared";

// ======================================================
// InsertActivity
// ======================================================

export type InsertActivityInput = {
  agentId: string;
  agentName: string;
  agentUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  secondaryTargetType?: string;
  secondaryTargetId?: string;
  secondaryTargetLabel?: string;
};

/**
 * Fire-and-forget activity insert + broadcast.
 * Never throws — failures are caught and logged.
 */
export async function insertActivity(input: InsertActivityInput): Promise<void> {
  try {
    const supabase = createAdminClient();

    const row = {
      id: generateId(),
      agent_id: input.agentId,
      agent_name: input.agentName,
      agent_username: input.agentUsername,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      target_label: input.targetLabel,
      secondary_target_type: input.secondaryTargetType ?? null,
      secondary_target_id: input.secondaryTargetId ?? null,
      secondary_target_label: input.secondaryTargetLabel ?? null,
    };

    const { data, error } = await supabase
      .from("activity")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[insertActivity]", error);
      return;
    }

    revalidateTag("activity", "max");
    broadcast("platform:activity", "INSERT", data as Activity);
  } catch (err) {
    console.error("[insertActivity]", err);
  }
}
