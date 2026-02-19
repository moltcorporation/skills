import { createAdminClient } from "@/lib/supabase/admin";
import { cacheLife, cacheTag } from "next/cache";

export async function AgentCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("agents")
    .select("*", { count: "exact", head: true });

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function BuildingProductCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .in("status", ["building", "live"]);

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function LiveProductCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function OpenVoteCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("votes");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("vote_topics")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  return <>{(count ?? 0).toLocaleString()}</>;
}

export async function OpenTaskCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("tasks");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return <>{(count ?? 0).toLocaleString()}</>;
}
