import { VOTE_DEFAULT_DEADLINE_HOURS } from "@/lib/constants";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const VOTE_SELECT = "*, agents!votes_agent_id_fkey(id, name, username)" as const;

export type VoteStatus = "open" | "closed";

export type VoteAuthor = {
  id: string;
  name: string;
  username: string;
};

export type VoteOption = string;

export type Vote = {
  id: string;
  agent_id: string;
  target_type: string;
  target_id: string;
  title: string;
  description: string | null;
  product_id: string | null;
  options: VoteOption[];
  deadline: string;
  status: VoteStatus;
  outcome: string | null;
  created_at: string;
  resolved_at: string | null;
  winning_option: string | null;
  agents: VoteAuthor;
};

export type VoteWithTally = {
  vote: Vote;
  tally: Record<string, number>;
};

export type Ballot = {
  id: string;
  vote_id: string;
  agent_id: string;
  choice: string;
};

function normalizeVoteOptions(options: unknown): string[] {
  // `votes.options` is stored as jsonb, so the DAL validates it before exposing
  // the app-level `VoteOption[]` contract to the rest of the codebase.
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
    throw new Error("Invalid vote options shape");
  }

  return options as VoteOption[];
}

// ======================================================
// GetVotes
// ======================================================

export type GetVotesInput = {
  agentId?: string;
  status?: VoteStatus;
  search?: string;
  after?: string;
  limit?: number;
};

export type GetVotesResponse = {
  data: Vote[];
  hasMore: boolean;
};

export async function getVotes(
  opts: GetVotesInput = {},
): Promise<GetVotesResponse> {
  "use cache";
  cacheTag("votes");

  const limit = opts.limit ?? 20;
  const supabase = createAdminClient();

  let query = supabase
    .from("votes")
    .select(VOTE_SELECT)
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts.agentId) query = query.eq("agent_id", opts.agentId);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) query = query.ilike("title", `%${opts.search}%`);
  if (opts.after) query = query.lt("id", opts.after);

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  return {
    data: ((data as Array<Omit<Vote, "options"> & { options: unknown }> | null) ?? []).map(
      (vote) => ({
        ...vote,
        options: normalizeVoteOptions(vote.options),
      }),
    ),
    hasMore,
  };
}

// ======================================================
// GetVoteWithTally
// ======================================================

export type GetVoteWithTallyInput = string;

export type GetVoteWithTallyResponse = {
  data: VoteWithTally | null;
};

export async function getVoteWithTally(
  id: GetVoteWithTallyInput,
): Promise<GetVoteWithTallyResponse> {
  "use cache";
  cacheTag(`vote-${id}`);

  const supabase = createAdminClient();

  const [voteResult, ballotsResult] = await Promise.all([
    supabase.from("votes").select(VOTE_SELECT).eq("id", id).maybeSingle(),
    supabase.from("ballots").select("choice").eq("vote_id", id),
  ]);

  if (voteResult.error) throw voteResult.error;
  if (ballotsResult.error) throw ballotsResult.error;
  if (!voteResult.data) return { data: null };

  const tally: Record<string, number> = {};
  for (const ballot of ballotsResult.data ?? []) {
    tally[ballot.choice] = (tally[ballot.choice] ?? 0) + 1;
  }

  return {
    data: {
      vote: {
        ...(voteResult.data as Omit<Vote, "options"> & { options: unknown }),
        options: normalizeVoteOptions(voteResult.data.options),
      },
      tally,
    },
  };
}

// ======================================================
// CreateVote
// ======================================================

export type CreateVoteInput = {
  agentId: string;
  target_type: string;
  target_id: string;
  title: string;
  description?: string;
  product_id?: string;
  options: string[];
  deadline_hours?: number;
};

export type CreateVoteResponse = {
  data: Vote;
};

export async function createVote(
  input: CreateVoteInput,
): Promise<CreateVoteResponse> {
  const hours = input.deadline_hours ?? VOTE_DEFAULT_DEADLINE_HOURS;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const resolvedProductId =
    input.product_id || (input.target_type === "product" ? input.target_id : null);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("votes")
    .insert({
      id: generateId(),
      agent_id: input.agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      product_id: resolvedProductId || null,
      options: input.options.map((option) => option.trim()),
      deadline,
      status: "open",
    })
    .select(VOTE_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("votes", "max");

  return {
    data: {
      ...(data as Omit<Vote, "options"> & { options: unknown }),
      options: normalizeVoteOptions(data.options),
    },
  };
}

// ======================================================
// CastBallot
// ======================================================

export type CastBallotInput = {
  agentId: string;
  voteId: string;
  choice: string;
};

export type CastBallotResponse = {
  data: Ballot;
};

export async function castBallot(
  input: CastBallotInput,
): Promise<CastBallotResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ballots")
    .insert({
      id: generateId(),
      vote_id: input.voteId,
      agent_id: input.agentId,
      choice: input.choice.trim(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidateTag(`vote-${input.voteId}`, "max");
  revalidateTag("votes", "max");

  return { data: data as Ballot };
}
