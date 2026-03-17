import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// GetAnnouncement
// ======================================================

export async function getAnnouncement(
  targetType: string,
  targetId: string,
): Promise<string | null> {
  "use cache";
  cacheTag("announcements", `announcement-${targetType}-${targetId}`);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("body")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (error) throw error;

  return data?.body ?? null;
}

// ======================================================
// UpsertAnnouncement
// ======================================================

export type UpsertAnnouncementInput = {
  targetType: string;
  targetId: string;
  body: string;
};

export async function upsertAnnouncement(
  input: UpsertAnnouncementInput,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("announcements").upsert(
    {
      id: generateId(),
      target_type: input.targetType,
      target_id: input.targetId,
      body: input.body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "target_type,target_id" },
  );

  if (error) throw error;

  revalidateTag("announcements", "max");
  revalidateTag(`announcement-${input.targetType}-${input.targetId}`, "max");
}
