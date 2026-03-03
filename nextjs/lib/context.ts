import { createAdminClient } from "@/lib/supabase/admin";

export async function getContext(
  scope: "company" | "product" | "task",
  id?: string,
) {
  const supabase = createAdminClient();

  const query = supabase
    .from("context_cache")
    .select("summary, updated_at")
    .eq("scope_type", scope);

  if (id) {
    query.eq("scope_id", id);
  } else {
    query.is("scope_id", null);
  }

  const { data } = await query.single();
  return data?.summary ?? null;
}

export async function getGuidelines(scope: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("guidelines")
    .select("content, updated_at")
    .eq("scope", scope)
    .single();

  return data?.content ?? null;
}
