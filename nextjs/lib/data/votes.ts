import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_DEFAULT_DEADLINE_HOURS } from "@/lib/constants";
import { generateId } from "@/lib/id";

const VOTE_SELECT = "*, agents!votes_agent_id_fkey(id, name, username)";

export async function getVotes(opts?: {
  agentId?: string;
  status?: string;
  search?: string;
  after?: string;
  limit?: number;
}) {
  "use cache";
  cacheTag("votes");

  const limit = opts?.limit ?? 20;
  const supabase = createAdminClient();

  let query = supabase
    .from("votes")
    .select(VOTE_SELECT)
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts?.agentId) query = query.eq("agent_id", opts.agentId);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.search) query = query.ilike("title", `%${opts.search}%`);
  if (opts?.after) query = query.lt("id", opts.after);

  const { data, error } = await query;

  if (error) return { data: null, hasMore: false, error: error.message };

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return { data, hasMore, error: null };
}

export async function getVoteWithTally(id: string) {
  "use cache";
  cacheTag(`vote-${id}`);


  const supabase = createAdminClient();

  const [voteResult, ballotsResult] = await Promise.all([
    supabase.from("votes").select(VOTE_SELECT).eq("id", id).single(),
    supabase.from("ballots").select("choice").eq("vote_id", id),
  ]);

  if (voteResult.error || !voteResult.data) {
    return { data: null, error: voteResult.error?.message ?? "Vote not found" };
  }

  const tally: Record<string, number> = {};
  for (const b of ballotsResult.data ?? []) {
    tally[b.choice] = (tally[b.choice] ?? 0) + 1;
  }

  return { data: { vote: voteResult.data, tally }, error: null };
}

export async function createVote(
  agentId: string,
  input: {
    target_type: string;
    target_id: string;
    title: string;
    description?: string;
    product_id?: string;
    options: string[];
    deadline_hours?: number;
  },
) {
  const hours = input.deadline_hours ?? VOTE_DEFAULT_DEADLINE_HOURS;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const resolvedProductId =
    input.product_id || (input.target_type === "product" ? input.target_id : null);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("votes")
    .insert({
      id: generateId(),
      agent_id: agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      product_id: resolvedProductId || null,
      options: input.options.map((o) => o.trim()),
      deadline,
      status: "open",
    })
    .select(VOTE_SELECT)
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag("votes", "max");
  revalidateTag("activity", "max");

  return { data, error: null };
}

export async function castBallot(
  agentId: string,
  voteId: string,
  choice: string,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ballots")
    .insert({
      id: generateId(),
      vote_id: voteId,
      agent_id: agentId,
      choice: choice.trim(),
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message, code: error.code };

  revalidateTag(`vote-${voteId}`, "max");
  revalidateTag("votes", "max");
  revalidateTag("activity", "max");

  return { data, error: null, code: null };
}
