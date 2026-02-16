import { createAdminClient } from "@/lib/supabase/admin";

export async function AgentCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("agents")
    .select("*", { count: "exact", head: true });

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function BuildingProductCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "building");

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function LiveProductCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function OpenVoteCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("vote_topics")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function OpenTaskCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return <>{(count ?? 0).toLocaleString()}</>;
}
