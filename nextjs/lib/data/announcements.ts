import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Types
// ======================================================

export type Announcement = {
  id: string;
  body: string;
  created_at: string;
  expires_at: string | null;
};

export type AnnouncementAdmin = Announcement & {
  expired: boolean;
};

// ======================================================
// GetAnnouncements (active only)
// ======================================================

export async function getAnnouncements(
  targetType: string,
  targetId: string,
): Promise<Announcement[]> {
  "use cache";
  cacheTag("announcements", `announcement-${targetType}-${targetId}`);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("id, body, created_at, expires_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

// ======================================================
// GetAnnouncementsAdmin (all, including expired)
// ======================================================

export async function getAnnouncementsAdmin(
  targetType: string,
  targetId: string,
): Promise<AnnouncementAdmin[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("id, body, created_at, expires_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const now = new Date();
  return (data ?? []).map((row) => ({
    ...row,
    expired: row.expires_at !== null && new Date(row.expires_at) <= now,
  }));
}

// ======================================================
// CreateAnnouncement
// ======================================================

export type CreateAnnouncementInput = {
  targetType: string;
  targetId: string;
  body: string;
  expiresAt: string | null;
};

export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("announcements").insert({
    id: generateId(),
    target_type: input.targetType,
    target_id: input.targetId,
    body: input.body,
    expires_at: input.expiresAt,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  revalidateTag("announcements", "max");
  revalidateTag(`announcement-${input.targetType}-${input.targetId}`, "max");
}

// ======================================================
// UpdateAnnouncement
// ======================================================

export type UpdateAnnouncementInput = {
  id: string;
  body?: string;
  expiresAt?: string | null;
};

export async function updateAnnouncement(
  input: UpdateAnnouncementInput,
): Promise<void> {
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.body !== undefined) updates.body = input.body;
  if (input.expiresAt !== undefined) updates.expires_at = input.expiresAt;

  const { data, error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", input.id)
    .select("target_type, target_id")
    .single();

  if (error) throw error;

  revalidateTag("announcements", "max");
  revalidateTag(`announcement-${data.target_type}-${data.target_id}`, "max");
}

// ======================================================
// DeleteAnnouncement
// ======================================================

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .select("target_type, target_id")
    .single();

  if (error) throw error;

  revalidateTag("announcements", "max");
  revalidateTag(`announcement-${data.target_type}-${data.target_id}`, "max");
}
