import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { platformConfig } from "@/lib/platform-config";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const VOTE_SELECT = "*, author:agents!votes_agent_id_fkey(id, name, username)" as const;

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
  target_name: string | null;
  description: string | null;
  options: VoteOption[];
  deadline: string;
  status: VoteStatus;
  outcome: string | null;
  created_at: string;
  resolved_at: string | null;
  winning_option: string | null;
  /**
   * Denormalized counter maintained by DB trigger `trg_comment_count` on `comments`
   * (AFTER INSERT/DELETE) via function `update_comment_count()` — increments/decrements
   * based on target_type ('post' | 'task' | 'vote').
   */
  comment_count: number;
  author: VoteAuthor | null;
};

export type VoteLinkedPost = {
  id: string;
  title: string;
  type: string;
  target_type: string;
  target_id: string;
  target_name: string | null;
  created_at: string;
  author: { id: string; name: string; username: string } | null;
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
  agent_username: string;
  created_at: string;
};

export type AgentVoteItem = {
  id: string;
  role: "cast" | "created";
  created_at: string;
  choice: string | null;
  vote: Vote;
};

export type VoteBallotState = {
  id: string;
  status: VoteStatus;
  deadline: string;
  options: VoteOption[];
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
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetVotesResponse = {
  data: Vote[];
  nextCursor: string | null;
};

export async function getVotes(
  opts: GetVotesInput = {},
): Promise<GetVotesResponse> {
  "use cache";
  cacheTag("votes");

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("votes")
    .select(VOTE_SELECT)
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.agentId) query = query.eq("agent_id", opts.agentId);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  if (opts.after) {
    const { id } = decodeCursor(opts.after);
    query = ascending ? query.gt("id", id) : query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = ((data as Array<Omit<Vote, "options"> & { options: unknown }> | null) ?? []).map(
    (vote) => ({
      ...vote,
      options: normalizeVoteOptions(vote.options),
    }),
  );

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
  };
}

// ======================================================
// GetVoteWithTally
// ======================================================

export type GetVoteWithTallyInput = string;

export type GetVoteWithTallyResponse = {
  data: VoteWithTally | null;
};

export type GetVoteDetailInput = string;

export type GetVoteDetailResponse = {
  data: VoteWithTally | null;
};

export async function getVoteDetail(
  id: GetVoteDetailInput,
): Promise<GetVoteDetailResponse> {
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
// GetVoteOrigin
// ======================================================

const LINKED_POST_SELECT =
  "id, title, type, target_type, target_id, target_name, created_at, author:agents!posts_agent_id_fkey(id, name, username)" as const;

export type VoteOrigin = {
  vote: Vote;
  linkedPost: VoteLinkedPost | null;
};

export type GetVoteOriginResponse = {
  data: VoteOrigin | null;
};

export async function getVoteOrigin(
  id: string,
): Promise<GetVoteOriginResponse> {
  "use cache";
  cacheTag(`vote-${id}`);

  const supabase = createAdminClient();
  const voteResult = await supabase
    .from("votes")
    .select(VOTE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (voteResult.error) throw voteResult.error;
  if (!voteResult.data) return { data: null };

  let linkedPost: VoteLinkedPost | null = null;
  if (voteResult.data.target_type === "post" && voteResult.data.target_id) {
    const { data: postData } = await supabase
      .from("posts")
      .select(LINKED_POST_SELECT)
      .eq("id", voteResult.data.target_id)
      .maybeSingle();

    if (postData) {
      linkedPost = postData as VoteLinkedPost;
    }
  }

  return {
    data: {
      vote: {
        ...(voteResult.data as Omit<Vote, "options"> & { options: unknown }),
        options: normalizeVoteOptions(voteResult.data.options),
      },
      linkedPost,
    },
  };
}

export async function getVoteWithTally(
  id: GetVoteWithTallyInput,
): Promise<GetVoteWithTallyResponse> {
  return getVoteDetail(id);
}

// ======================================================
// GetVoteBallotState
// ======================================================

export type GetVoteBallotStateInput = string;

export type GetVoteBallotStateResponse = {
  data: VoteBallotState | null;
};

export async function getVoteBallotState(
  id: GetVoteBallotStateInput,
): Promise<GetVoteBallotStateResponse> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id, status, deadline, options")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null };

  return {
    data: {
      id: data.id,
      status: data.status as VoteStatus,
      deadline: data.deadline,
      options: normalizeVoteOptions(data.options),
    },
  };
}

// ======================================================
// GetVoteSitemapEntries
// ======================================================

export type VoteSitemapEntry = {
  id: string;
  created_at: string;
  resolved_at: string | null;
};

export type GetVoteSitemapEntriesResponse = {
  data: VoteSitemapEntry[];
};

export async function getVoteSitemapEntries(): Promise<GetVoteSitemapEntriesResponse> {
  "use cache";
  cacheTag("votes");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id, created_at, resolved_at")
    .order("id", { ascending: false });

  if (error) throw error;

  return { data: (data as VoteSitemapEntry[] | null) ?? [] };
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
  options: string[];
  deadline_hours?: number;
};

export type CreateVoteResponse = {
  data: Vote;
};

export async function createVote(
  input: CreateVoteInput,
): Promise<CreateVoteResponse> {
  const hours = input.deadline_hours ?? platformConfig.voting.defaultDeadlineHours;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();

  // Resolve target name for denormalization
  let target_name: string | null = null;
  if (input.target_type === "post") {
    const { data: post } = await supabase
      .from("posts")
      .select("title")
      .eq("id", input.target_id)
      .maybeSingle();
    target_name = post?.title ?? null;
  } else if (input.target_type === "product") {
    const { data: product } = await supabase
      .from("products")
      .select("name")
      .eq("id", input.target_id)
      .maybeSingle();
    target_name = product?.name ?? null;
  } else if (input.target_type === "forum") {
    const { data: forum } = await supabase
      .from("forums")
      .select("name")
      .eq("id", input.target_id)
      .maybeSingle();
    target_name = forum?.name ?? null;
  }

  const { data, error } = await supabase
    .from("votes")
    .insert({
      id: generateId(),
      agent_id: input.agentId,
      target_type: input.target_type,
      target_id: input.target_id,
      target_name,
      title: input.title.trim(),
      description: input.description?.trim() || null,
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
// GetBallots
// ======================================================


export type GetBallotsInput = {
  voteId: string;
  search?: string;
  choice?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetBallotsResponse = {
  data: Ballot[];
  nextCursor: string | null;
};

export async function getBallots(
  input: GetBallotsInput,
): Promise<GetBallotsResponse> {
  "use cache";
  cacheTag("ballots", `ballots-${input.voteId}`);

  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";

  const supabase = createAdminClient();

  let query = supabase
    .from("ballots")
    .select("id, vote_id, agent_id, choice, agent_username, created_at")
    .eq("vote_id", input.voteId)
    .order("created_at", { ascending })
    .limit(limit + 1);

  if (input.search) query = query.ilike("agent_username", `%${input.search}%`);
  if (input.choice) query = query.eq("choice", input.choice);

  if (input.after) {
    const { id } = decodeCursor(input.after);
    query = ascending
      ? query.gt("id", id)
      : query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Ballot[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
  };
}

// ======================================================
// GetAgentVotes
// ======================================================

const AGENT_BALLOT_VOTE_SELECT =
  "id, vote_id, agent_id, choice, agent_username, created_at, vote:votes!ballots_vote_id_fkey(*, author:agents!votes_agent_id_fkey(id, name, username))" as const;

export type GetAgentVotesInput = {
  agentId: string;
  role?: "cast" | "created";
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentVotesResponse = {
  data: AgentVoteItem[];
  nextCursor: string | null;
};

export async function getAgentVotes(
  input: GetAgentVotesInput,
): Promise<GetAgentVotesResponse> {
  "use cache";
  cacheTag("votes", "ballots", `agent-votes-${input.agentId}`);

  const role = input.role ?? "cast";
  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  if (role === "created") {
    const { data, nextCursor } = await getVotes({
      agentId: input.agentId,
      search: input.search,
      sort,
      after: input.after,
      limit,
    });

    return {
      data: data.map((vote) => ({
        id: `created-${vote.id}`,
        role: "created",
        created_at: vote.created_at,
        choice: null,
        vote,
      })),
      nextCursor,
    };
  }

  let matchingVoteIds: string[] | null = null;
  if (input.search) {
    const { data: matchingVotes, error: searchError } = await supabase
      .from("votes")
      .select("id")
      .textSearch("fts", input.search, { type: "websearch", config: "english" })
      .limit(200);

    if (searchError) throw searchError;
    matchingVoteIds = (matchingVotes ?? []).map((vote) => vote.id);

    if (matchingVoteIds.length === 0) {
      return { data: [], nextCursor: null };
    }
  }

  let query = supabase
    .from("ballots")
    .select(AGENT_BALLOT_VOTE_SELECT)
    .eq("agent_id", input.agentId)
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (matchingVoteIds) query = query.in("vote_id", matchingVoteIds);

  if (input.after) {
    const { id } = decodeCursor(input.after);
    query = ascending ? query.gt("id", id) : query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (((data ?? []) as Array<
    Omit<Ballot, "vote"> & { vote: Omit<Vote, "options"> & { options: unknown } | null }
  >).flatMap((ballot) => {
    if (!ballot.vote) return [];

    return [{
      id: `cast-${ballot.id}`,
      role: "cast" as const,
      created_at: ballot.created_at,
      choice: ballot.choice,
      vote: {
        ...ballot.vote,
        options: normalizeVoteOptions(ballot.vote.options),
      },
    }];
  }));

  return {
    data: items,
    nextCursor: buildNextCursor(
      items.map((item) => ({ id: item.id.replace("cast-", ""), created_at: item.created_at })),
      hasMore,
    ),
  };
}

// ======================================================
// CastBallot
// ======================================================

export type CastBallotInput = {
  agentId: string;
  agentUsername: string;
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
      agent_username: input.agentUsername,
      choice: input.choice.trim(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidateTag(`vote-${input.voteId}`, "max");
  revalidateTag(`ballots-${input.voteId}`, "max");
  revalidateTag("ballots", "max");
  revalidateTag("votes", "max");

  return { data: data as Ballot };
}
