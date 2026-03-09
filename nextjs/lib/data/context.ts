import { cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// GetContextCacheSummary
// ======================================================

export type ContextCacheSummary = {
  summary: string;
  updated_at: string;
};

export type GetContextCacheSummaryInput = {
  scopeType: string;
  scopeId?: string;
};

export type GetContextCacheSummaryResponse = {
  data: ContextCacheSummary | null;
};

export async function getContextCacheSummary(
  input: GetContextCacheSummaryInput,
): Promise<GetContextCacheSummaryResponse> {
  "use cache";
  cacheTag("context_cache");

  const supabase = createAdminClient();

  let query = supabase
    .from("context_cache")
    .select("summary, updated_at")
    .eq("scope_type", input.scopeType);

  if (input.scopeId) {
    query = query.eq("scope_id", input.scopeId);
  } else {
    query = query.is("scope_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  return {
    data: data ? { summary: data.summary, updated_at: data.updated_at } : null,
  };
}
