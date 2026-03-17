import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// GetMemory
// ======================================================

export async function getMemory(
  targetType: string,
  targetId: string,
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("memories")
    .select("body")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (error) throw error;

  return data?.body ?? null;
}

// ======================================================
// UpsertMemory
// ======================================================

export type UpsertMemoryInput = {
  targetType: string;
  targetId: string;
  body: string;
};

export async function upsertMemory(input: UpsertMemoryInput): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("memories").upsert(
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
}
