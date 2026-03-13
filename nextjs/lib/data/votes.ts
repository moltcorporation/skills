import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { insertActivity } from "@/lib/data/activity";
import { generateId } from "@/lib/id";
import { platformConfig } from "@/lib/platform-config";
import { slackLog } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { createClient } from "@/lib/supabase/server";
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
  workflow_run_id: string | null;
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

export type AgentBallot = {
  ballot: Ballot;
  vote: Vote;
};

export type VoteBallotState = {
  id: string;
  title: string;
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
  const orderAllVotes = !opts.status;
  const supabase = createAdminClient();

  let query = supabase
    .from("votes")
    .select(VOTE_SELECT)
    .order("status", { ascending: false })
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (!orderAllVotes) {
    query = supabase
      .from("votes")
      .select(VOTE_SELECT)
      .order("created_at", { ascending })
      .order("id", { ascending })
      .limit(limit + 1);
  }

  if (opts.agentId) query = query.eq("agent_id", opts.agentId);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  if (opts.after) {
    const { id, v } = decodeCursor(opts.after);
    const createdAt = orderAllVotes ? v?.[1] : v?.[0];

    if (createdAt != null) {
      const createdAtIso = new Date(createdAt).toISOString();

      if (orderAllVotes) {
        const status = v?.[0] === 1 ? "open" : "closed";
        const createdAtComparator = ascending ? "gt" : "lt";
        const idComparator = ascending ? "gt" : "lt";

        query = query.or(
          [
            `status.lt.${status}`,
            `and(status.eq.${status},created_at.${createdAtComparator}.${createdAtIso})`,
            `and(status.eq.${status},created_at.eq.${createdAtIso},id.${idComparator}.${id})`,
          ].join(","),
        );
      } else {
        const comparator = ascending ? "gt" : "lt";
        query = query.or(
          `created_at.${comparator}.${createdAtIso},and(created_at.eq.${createdAtIso},id.${comparator}.${id})`,
        );
      }
    }
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
    nextCursor: buildNextCursor(items, hasMore, (vote) =>
      orderAllVotes
        ? [vote.status === "open" ? 1 : 0, Date.parse(vote.created_at)]
        : [Date.parse(vote.created_at)],
    ),
  };
}

// ======================================================
// GetVoteWithTally
// ======================================================

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
    .select("id, title, status, deadline, options")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null };

  return {
    data: {
      id: data.id,
      title: data.title,
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

export type DuplicateVoteError = {
  duplicate: true;
  existingVoteId: string;
};

export async function createVote(
  input: CreateVoteInput,
): Promise<CreateVoteResponse | DuplicateVoteError> {
  const supabase = createAdminClient();

  // Check for existing open vote on the same target
  const { data: existingVote, error: checkError } = await supabase
    .from("votes")
    .select("id")
    .eq("target_type", input.target_type)
    .eq("target_id", input.target_id)
    .eq("status", "open")
    .maybeSingle();

  if (checkError) throw checkError;
  if (existingVote) {
    return { duplicate: true, existingVoteId: existingVote.id };
  }

  const hours = input.deadline_hours ?? platformConfig.voting.defaultDeadlineHours;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

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
  revalidateTag("activity", "max");

  const normalizedVote = {
    ...(data as Omit<Vote, "options"> & { options: unknown }),
    options: normalizeVoteOptions(data.options),
  };

  broadcast("platform:votes", "INSERT", normalizedVote);

  if (normalizedVote.author) {
    insertActivity({
      agentId: normalizedVote.agent_id,
      agentName: normalizedVote.author.name,
      agentUsername: normalizedVote.author.username,
      action: "create",
      targetType: "vote",
      targetId: normalizedVote.id,
      targetLabel: normalizedVote.title,
    });
  }

  return { data: normalizedVote };
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
// GetAgentCreatedVotes
// ======================================================

const AGENT_BALLOT_VOTE_SELECT =
  "id, vote_id, agent_id, choice, agent_username, created_at, vote:votes!ballots_vote_id_fkey(*, author:agents!votes_agent_id_fkey(id, name, username))" as const;

export type GetAgentCreatedVotesInput = {
  agentId: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentCreatedVotesResponse = {
  data: Vote[];
  nextCursor: string | null;
};

export async function getAgentCreatedVotes(
  input: GetAgentCreatedVotesInput,
): Promise<GetAgentCreatedVotesResponse> {
  "use cache";
  cacheTag("votes", `agent-created-votes-${input.agentId}`);

  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const sort = input.sort ?? "newest";
  const { data, nextCursor } = await getVotes({
    agentId: input.agentId,
    search: input.search,
    sort,
    after: input.after,
    limit,
  });

  return { data, nextCursor };
}

// ======================================================
// GetAgentBallots
// ======================================================

export type GetAgentBallotsInput = {
  agentId: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentBallotsResponse = {
  data: AgentBallot[];
  nextCursor: string | null;
};

export async function getAgentBallots(
  input: GetAgentBallotsInput,
): Promise<GetAgentBallotsResponse> {
  "use cache";
  cacheTag("ballots", "votes", `agent-ballots-${input.agentId}`);

  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

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
    Ballot & { vote: Omit<Vote, "options"> & { options: unknown } | null }
  >).flatMap((row) => {
    if (!row.vote) return [];

    return [{
      ballot: {
        id: row.id,
        vote_id: row.vote_id,
        agent_id: row.agent_id,
        choice: row.choice,
        agent_username: row.agent_username,
        created_at: row.created_at,
      },
      vote: {
        ...row.vote,
        options: normalizeVoteOptions(row.vote.options),
      },
    }];
  }));

  return {
    data: items,
    nextCursor: buildNextCursor(
      items.map((item) => ({ id: item.ballot.id, created_at: item.ballot.created_at })),
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
  agentName: string;
  voteId: string;
  voteTitle: string;
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

  revalidateTag("activity", "max");

  broadcast(
    ["platform:ballots", `vote:${input.voteId}:ballots`],
    "INSERT",
    data as Ballot,
  );

  insertActivity({
    agentId: input.agentId,
    agentName: input.agentName,
    agentUsername: input.agentUsername,
    action: "cast",
    targetType: "vote",
    targetId: input.voteId,
    targetLabel: input.voteTitle,
  });

  return { data: data as Ballot };
}

// ======================================================
// ResolveVote
// ======================================================

export type ResolveVoteInput = {
  voteId: string;
  winningOption: string | null;
  outcome: string;
};

export async function resolveVote(input: ResolveVoteInput): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("votes")
    .update({
      status: "closed",
      winning_option: input.winningOption,
      outcome: input.outcome,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.voteId);

  if (error) throw error;

  revalidateTag(`vote-${input.voteId}`, "max");
  revalidateTag("votes", "max");

  broadcast("platform:votes", "UPDATE", {
    id: input.voteId,
    status: "closed",
    winning_option: input.winningOption,
    outcome: input.outcome,
  });

  insertActivity({
    agentId: "system",
    agentName: "System",
    agentUsername: "system",
    action: "resolve",
    targetType: "vote",
    targetId: input.voteId,
    targetLabel: input.outcome,
  });
}

// ======================================================
// ExtendVoteDeadline
// ======================================================

export type ExtendVoteDeadlineInput = {
  voteId: string;
};

export async function extendVoteDeadline(
  input: ExtendVoteDeadlineInput,
): Promise<{ newDeadline: string }> {
  const supabase = createAdminClient();

  const { data: vote, error: fetchError } = await supabase
    .from("votes")
    .select("deadline")
    .eq("id", input.voteId)
    .single();

  if (fetchError || !vote) throw fetchError ?? new Error("Vote not found");

  const currentDeadline = new Date(vote.deadline);
  const extensionMs = platformConfig.voting.tieExtensionHours * 60 * 60 * 1000;
  const newDeadline = new Date(
    Math.max(currentDeadline.getTime(), Date.now()) + extensionMs,
  ).toISOString();

  const { error } = await supabase
    .from("votes")
    .update({ deadline: newDeadline })
    .eq("id", input.voteId);

  if (error) throw error;

  revalidateTag(`vote-${input.voteId}`, "max");
  revalidateTag("votes", "max");

  return { newDeadline };
}

// ======================================================
// SaveWorkflowRunId
// ======================================================

export async function saveWorkflowRunId(
  voteId: string,
  runId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("votes")
    .update({ workflow_run_id: runId })
    .eq("id", voteId);

  if (error) throw error;
}

// ======================================================
// FastForwardVote
// ======================================================

export async function fastForwardVote(
  voteId: string,
): Promise<{ newDeadline: string }> {
  const { getRun, start } = await import("workflow/api");
  const { voteResolutionWorkflow } = await import(
    "@/lib/workflows/vote-resolution"
  );

  const supabase = createAdminClient();

  // Fetch current workflow run ID
  const { data: vote, error: fetchError } = await supabase
    .from("votes")
    .select("workflow_run_id")
    .eq("id", voteId)
    .single();

  if (fetchError || !vote) throw fetchError ?? new Error("Vote not found");

  // Cancel existing workflow if present
  if (vote.workflow_run_id) {
    try {
      const existingRun = getRun(vote.workflow_run_id);
      await existingRun.cancel();
    } catch (err) {
      console.error("[votes] failed to cancel workflow:", err);
    }
  }

  // Set new deadline to ~10s from now
  const newDeadline = new Date(Date.now() + 10_000).toISOString();

  // Update vote with new deadline, clear old run ID
  const { error: updateError } = await supabase
    .from("votes")
    .update({ deadline: newDeadline, workflow_run_id: null })
    .eq("id", voteId);

  if (updateError) throw updateError;

  // Start new workflow with short deadline
  const run = await start(voteResolutionWorkflow, [voteId, newDeadline]);
  await saveWorkflowRunId(voteId, run.runId);

  revalidateTag(`vote-${voteId}`, "max");
  revalidateTag("votes", "max");

  return { newDeadline };
}

// ======================================================
// DeleteVote
// ======================================================

export type DeleteVoteInput = string;

export async function deleteVote(voteId: DeleteVoteInput): Promise<void> {
  // Use session client so RLS enforces the permission
  const supabase = await createClient();

  // Fetch vote details before deleting (for logging)
  const admin = createAdminClient();
  const { data: vote } = await admin
    .from("votes")
    .select("id, title, agent_id")
    .eq("id", voteId)
    .maybeSingle();

  const { error } = await supabase.from("votes").delete().eq("id", voteId);
  if (error) throw error;

  revalidateTag("votes", "max");
  if (vote) {
    revalidateTag(`vote-${voteId}`, "max");
  }

  broadcast("platform:votes", "DELETE", { id: voteId });

  slackLog(`Admin deleted vote: "${vote?.title ?? voteId}"`);
}
