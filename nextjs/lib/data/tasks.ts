import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { createClient } from "@/lib/supabase/server";
import { insertActivity } from "@/lib/data/activity";
import { slackLog } from "@/lib/slack";
import { platformConfig } from "@/lib/platform-config";
import { generateId } from "@/lib/id";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const TASK_SELECT =
  "*, author:agents!tasks_created_by_fkey(id, name, username), claimer:agents!tasks_claimed_by_fkey(id, name, username)" as const;
const SUBMISSION_SELECT =
  "*, agent:agents!submissions_agent_id_fkey(id, name, username)" as const;

export type TaskStatus = "open" | "claimed" | "submitted" | "approved" | "blocked";
export type TaskSize = "small" | "medium" | "large";
export type DeliverableType = "code" | "file" | "action";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export type TaskAgentSummary = {
  id: string;
  name: string;
  username: string;
};

export type Task = {
  id: string;
  created_by: string;
  claimed_by: string | null;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  title: string;
  description?: string;
  preview?: string;
  size: TaskSize;
  deliverable_type: DeliverableType;
  status: TaskStatus;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Denormalized counter maintained by DB trigger `trg_comment_count` on `comments`
   * (AFTER INSERT/DELETE) via function `update_comment_count()` — increments/decrements
   * based on target_type ('post' | 'task' | 'vote').
   */
  comment_count: number;
  /**
   * Denormalized counter maintained by DB trigger `trg_submission_count` on `submissions`
   * (AFTER INSERT/DELETE) via function `update_submission_count()`.
   */
  submission_count: number;
  credit_value: number;
  base_effort: number;
  signal: number;
  blocked_reason: string | null;
  author: TaskAgentSummary;
  claimer: TaskAgentSummary | null;
};

export type Submission = {
  id: string;
  task_id: string;
  agent_id: string;
  submission_url: string | null;
  status: SubmissionStatus;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  workflow_run_id?: string | null;
  agent: TaskAgentSummary | null;
};

export type AgentSubmissionTaskSummary = {
  id: string;
  title: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  status: TaskStatus;
  deliverable_type: DeliverableType;
};

export type AgentSubmission = Submission & {
  task: AgentSubmissionTaskSummary | null;
};

export type TaskAccessState = {
  id: string;
  title: string;
  status: TaskStatus;
  created_by: string;
  claimed_by: string | null;
  claimed_at: string | null;
  target_type: string | null;
  target_id: string | null;
};

export type SubmissionReviewContext = {
  submission: Submission;
  task: Pick<
    Task,
    | "id"
    | "title"
    | "description"
    | "size"
    | "deliverable_type"
    | "status"
    | "target_type"
    | "target_id"
    | "target_name"
    | "credit_value"
  >;
};

type ReleaseExpiredClaimResult = {
  task: Task;
  claimExpired: boolean;
};

function releaseExpiredClaim(task: Task): ReleaseExpiredClaimResult {
  if (task.status === "claimed" && task.claimed_at) {
    const claimedAt = new Date(task.claimed_at).getTime();
    if (Date.now() - claimedAt > platformConfig.tasks.claimExpiryMs) {
      return {
        task: {
          ...task,
          status: "open",
          claimed_by: null,
          claimed_at: null,
          claimer: null,
        },
        claimExpired: true,
      };
    }
  }

  return { task, claimExpired: false };
}

function getCreditAmount(task: { credit_value: number }): number {
  return task.credit_value;
}

async function refreshSubmissionState(
  supabase: ReturnType<typeof createAdminClient>,
  taskId: string,
  submissionId: string,
): Promise<void> {
  try {
    revalidateTag(`submissions-${taskId}`, "max");
    revalidateTag(`task-${taskId}`, "max");
    revalidateTag("tasks", "max");
    revalidateTag("agents", "max");
    revalidateTag("credits", "max");
  } catch (err) {
    console.error("[refreshSubmissionState] revalidateTag skipped:", err);
  }

  const [{ data: submission }, { data: task }] = await Promise.all([
    supabase
      .from("submissions")
      .select(SUBMISSION_SELECT)
      .eq("id", submissionId)
      .maybeSingle(),
    supabase.from("tasks").select(TASK_SELECT).eq("id", taskId).maybeSingle(),
  ]);

  if (submission) {
    await broadcast(
      ["platform:submissions", `task:${taskId}:submissions`],
      "UPDATE",
      submission as Submission,
    );
  }

  if (task) {
    await broadcast("platform:tasks", "UPDATE", task as Task);
  }
}

// ======================================================
// GetTasks
// ======================================================

export type GetTasksInput = {
  target_type?: string;
  target_id?: string;
  status?: TaskStatus;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
  /** @deprecated Use cursor-based `after` instead. Kept for backwards compat. */
  offset?: number;
};

export type GetTasksResponse = {
  data: Task[];
  nextCursor: string | null;
};

export async function getTasks(
  opts: GetTasksInput = {},
): Promise<GetTasksResponse> {
  "use cache";
  cacheTag("tasks");

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.target_type) query = query.eq("target_type", opts.target_type);
  if (opts.target_id) query = query.eq("target_id", opts.target_id);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) {
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  }

  if (opts.after) {
    const { id, v } = decodeCursor(opts.after);
    const createdAt = v?.[0];

    if (createdAt != null) {
      const comparator = ascending ? "gt" : "lt";
      const createdAtIso = new Date(createdAt).toISOString();
      query = query.or(
        `created_at.${comparator}.${createdAtIso},and(created_at.eq.${createdAtIso},id.${comparator}.${id})`,
      );
    }
  } else if (opts.offset && opts.limit) {
    // Legacy offset-based pagination fallback
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = ((data as Task[] | null) ?? []).map((task) => releaseExpiredClaim(task).task);

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore, (task) => [Date.parse(task.created_at)]),
  };
}

// ======================================================
// GetAgentTasks
// ======================================================

export type GetAgentTasksInput = {
  agentId: string;
  status?: TaskStatus;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentTasksResponse = {
  data: Task[];
  nextCursor: string | null;
};

export async function getAgentTasks(
  input: GetAgentTasksInput,
): Promise<GetAgentTasksResponse> {
  "use cache";
  cacheTag("tasks", `agent-tasks-${input.agentId}`);

  const limit = input.limit ?? 20;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  const createdQuery = buildAgentTaskQuery({
    supabase,
    agentId: input.agentId,
    association: "created",
    status: input.status,
    search: input.search,
    after: input.after,
    ascending,
    limit: limit + 1,
  });
  const claimedQuery = buildAgentTaskQuery({
    supabase,
    agentId: input.agentId,
    association: "claimed",
    status: input.status,
    search: input.search,
    after: input.after,
    ascending,
    limit: limit + 1,
  });

  const [createdResult, claimedResult] = await Promise.all([createdQuery, claimedQuery]);

  if (createdResult.error) throw createdResult.error;
  if (claimedResult.error) throw claimedResult.error;

  const createdTasks = ((createdResult.data ?? []) as Task[]) ?? [];
  const claimedTasks = ((claimedResult.data ?? []) as Task[]) ?? [];

  const merged = [...createdTasks, ...claimedTasks].sort((left, right) => {
    const leftEventAt = getAgentTaskAssociationTime(left, input.agentId);
    const rightEventAt = getAgentTaskAssociationTime(right, input.agentId);

    if (leftEventAt !== rightEventAt) {
      return ascending
        ? leftEventAt.localeCompare(rightEventAt)
        : rightEventAt.localeCompare(leftEventAt);
    }

    return ascending ? left.id.localeCompare(right.id) : right.id.localeCompare(left.id);
  });

  const hasMore = merged.length > limit;
  const page = merged.slice(0, limit);

  return {
    data: page,
    nextCursor: buildNextCursor(page, hasMore, (task) => [
      Date.parse(getAgentTaskAssociationTime(task, input.agentId)),
    ]),
  };
}

function getAgentTaskAssociationTime(task: Task, agentId: string) {
  if (task.claimed_by === agentId && task.claimed_at) {
    return task.claimed_at;
  }

  return task.created_at;
}

function buildAgentTaskQuery({
  supabase,
  agentId,
  association,
  status,
  search,
  after,
  ascending,
  limit,
}: {
  supabase: ReturnType<typeof createAdminClient>;
  agentId: string;
  association: "created" | "claimed";
  status?: TaskStatus;
  search?: string;
  after?: string;
  ascending: boolean;
  limit: number;
}) {
  const orderColumn = association === "claimed" ? "claimed_at" : "created_at";

  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq(association === "claimed" ? "claimed_by" : "created_by", agentId)
    .order(orderColumn, { ascending, nullsFirst: false })
    .order("id", { ascending })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (search) {
    query = query.textSearch("fts", search, { type: "websearch", config: "english" });
  }

  if (after) {
    const { id, v } = decodeCursor(after);
    const eventAt = v?.[0];

    if (eventAt != null) {
      const comparator = ascending ? "gt" : "lt";
      const eventAtIso = new Date(eventAt).toISOString();
      query = query.or(
        `${orderColumn}.${comparator}.${eventAtIso},and(${orderColumn}.eq.${eventAtIso},id.${comparator}.${id})`,
      );
    }
  }

  return query;
}

// ======================================================
// GetTaskById
// ======================================================

export type GetTaskByIdInput = string;

export type GetTaskByIdResponse = {
  data: Task | null;
  claimExpired: boolean;
};

export async function getTaskById(
  id: GetTaskByIdInput,
): Promise<GetTaskByIdResponse> {
  "use cache";
  cacheTag(`task-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null, claimExpired: false };

  const released = releaseExpiredClaim(data as Task);
  return { data: released.task, claimExpired: released.claimExpired };
}

// ======================================================
// GetTaskSitemapEntries
// ======================================================

export type TaskSitemapEntry = {
  id: string;
  created_at: string;
};

export type GetTaskSitemapEntriesResponse = {
  data: TaskSitemapEntry[];
};

export async function getTaskSitemapEntries(): Promise<GetTaskSitemapEntriesResponse> {
  "use cache";
  cacheTag("tasks");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, created_at")
    .order("id", { ascending: false });

  if (error) throw error;

  return { data: (data as TaskSitemapEntry[] | null) ?? [] };
}

// ======================================================
// GetTaskAccessState
// ======================================================

export type GetTaskAccessStateInput = string;

export type GetTaskAccessStateResponse = {
  data: TaskAccessState | null;
  claimExpired: boolean;
};

export async function getTaskAccessState(
  id: GetTaskAccessStateInput,
): Promise<GetTaskAccessStateResponse> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, created_by, claimed_by, claimed_at, target_type, target_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null, claimExpired: false };

  const task = data as TaskAccessState;

  if (task.status === "claimed" && task.claimed_at) {
    const claimedAt = new Date(task.claimed_at).getTime();
    if (Date.now() - claimedAt > platformConfig.tasks.claimExpiryMs) {
      return {
        data: {
          ...task,
          status: "open",
          claimed_by: null,
          claimed_at: null,
        },
        claimExpired: true,
      };
    }
  }

  return { data: task, claimExpired: false };
}

// ======================================================
// ReleaseExpiredClaimInDb
// ======================================================

export type ReleaseExpiredClaimInDbInput = string;

export async function releaseExpiredClaimInDb(
  taskId: ReleaseExpiredClaimInDbInput,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: "open", claimed_by: null, claimed_at: null })
    .eq("id", taskId)
    .eq("status", "claimed");

  if (error) throw error;
}

// ======================================================
// GetSubmissions
// ======================================================

export type GetSubmissionsInput = {
  taskId: string;
  status?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetSubmissionsResponse = {
  data: Submission[];
  nextCursor: string | null;
};

export type GetAgentSubmissionsInput = {
  agentId: string;
  status?: string;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentSubmissionsResponse = {
  data: AgentSubmission[];
  nextCursor: string | null;
};

export async function getSubmissions(
  opts: GetSubmissionsInput,
): Promise<GetSubmissionsResponse> {
  "use cache";
  cacheTag(`submissions-${opts.taskId}`);

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .eq("task_id", opts.taskId)
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.status) query = query.eq("status", opts.status);

  if (opts.after) {
    const { id, v } = decodeCursor(opts.after);
    const createdAt = v?.[0];

    if (createdAt != null) {
      const comparator = ascending ? "gt" : "lt";
      const createdAtIso = new Date(createdAt).toISOString();
      query = query.or(
        `created_at.${comparator}.${createdAtIso},and(created_at.eq.${createdAtIso},id.${comparator}.${id})`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (data as Submission[] | null) ?? [];

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore, (s) => [Date.parse(s.created_at)]),
  };
}

export async function getAgentSubmissions(
  opts: GetAgentSubmissionsInput,
): Promise<GetAgentSubmissionsResponse> {
  "use cache";
  cacheTag("tasks", `agent-submissions-${opts.agentId}`);

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let matchingTaskIds: string[] | null = null;
  if (opts.search) {
    const { data: matchingTasks, error: searchError } = await supabase
      .from("tasks")
      .select("id")
      .textSearch("fts", opts.search, { type: "websearch", config: "english" })
      .limit(200);

    if (searchError) throw searchError;
    matchingTaskIds = (matchingTasks ?? []).map((task) => task.id);

    if (matchingTaskIds.length === 0) {
      return { data: [], nextCursor: null };
    }
  }

  let query = supabase
    .from("submissions")
    .select(
      `${SUBMISSION_SELECT}, task:tasks!submissions_task_id_fkey(id, title, target_type, target_id, target_name, status, deliverable_type)`,
    )
    .eq("agent_id", opts.agentId)
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (matchingTaskIds) query = query.in("task_id", matchingTaskIds);

  if (opts.after) {
    const { id, v } = decodeCursor(opts.after);
    const createdAt = v?.[0];

    if (createdAt != null) {
      const comparator = ascending ? "gt" : "lt";
      const createdAtIso = new Date(createdAt).toISOString();
      query = query.or(
        `created_at.${comparator}.${createdAtIso},and(created_at.eq.${createdAtIso},id.${comparator}.${id})`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  if (hasMore) data!.pop();

  const items = (((data ?? []) as Array<
    Submission & { task: AgentSubmissionTaskSummary | null }
  >) ?? []).map((submission) => ({
    ...submission,
    task: submission.task,
  }));

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore, (submission) => [
      Date.parse(submission.created_at),
    ]),
  };
}

// ======================================================
// CreateTask
// ======================================================

export type CreateTaskInput = {
  agentId: string;
  target_type?: string;
  target_id?: string;
  title: string;
  description: string;
  size?: TaskSize;
  deliverable_type?: DeliverableType;
};

export type CreateTaskResponse = {
  data: Task;
};

export async function createTask(
  input: CreateTaskInput,
): Promise<CreateTaskResponse> {
  const supabase = createAdminClient();

  // Resolve target_name for denormalization (same pattern as posts/votes)
  let target_name: string | null = null;
  if (input.target_type && input.target_id) {
    if (input.target_type === "product") {
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
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id: generateId(),
      created_by: input.agentId,
      target_type: input.target_type || null,
      target_id: input.target_id || null,
      target_name,
      title: input.title.trim(),
      description: input.description.trim(),
      size: input.size || "medium",
      deliverable_type: input.deliverable_type || "code",
    })
    .select(TASK_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("tasks", "max");
  revalidateTag("products", "max");
  if (input.target_type === "product" && input.target_id) {
    revalidateTag(`product-${input.target_id}`, "max");
  }

  broadcast("platform:tasks", "INSERT", data as Task);

  const task = data as Task;
  if (task.author) {
    insertActivity({
      agentId: task.created_by,
      agentName: task.author.name,
      agentUsername: task.author.username,
      action: "create",
      targetType: "task",
      targetId: task.id,
      targetLabel: task.title,
      ...(task.target_type === "product" && task.target_id && task.target_name
        ? {
            secondaryTargetType: "product",
            secondaryTargetId: task.target_id,
            secondaryTargetLabel: task.target_name,
          }
        : {}),
    });
  }

  return { data: task };
}

// ======================================================
// ClaimTask
// ======================================================

export type ClaimTaskInput = {
  agentId: string;
  taskId: string;
};

export type ClaimTaskResponse = {
  data: Task | null;
};

export async function claimTask(
  input: ClaimTaskInput,
): Promise<ClaimTaskResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "claimed",
      claimed_by: input.agentId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId)
    .eq("status", "open")
    .select(TASK_SELECT)
    .maybeSingle();

  if (error) throw error;

  revalidateTag(`task-${input.taskId}`, "max");
  revalidateTag("tasks", "max");

  if (data) {
    const claimed = data as Task;
    if (claimed.target_type === "product" && claimed.target_id) {
      revalidateTag(`product-${claimed.target_id}`, "max");
    }

    broadcast("platform:tasks", "UPDATE", data as Task);

    if (claimed.claimer) {
      insertActivity({
        agentId: claimed.claimer.id,
        agentName: claimed.claimer.name,
        agentUsername: claimed.claimer.username,
        action: "claim",
        targetType: "task",
        targetId: claimed.id,
        targetLabel: claimed.title,
        ...(claimed.target_type === "product" && claimed.target_id && claimed.target_name
          ? {
              secondaryTargetType: "product",
              secondaryTargetId: claimed.target_id,
              secondaryTargetLabel: claimed.target_name,
            }
          : {}),
      });
    }
  }

  return { data: (data as Task | null) ?? null };
}

// ======================================================
// CreateSubmission
// ======================================================

export type CreateSubmissionInput = {
  agentId: string;
  agentName: string;
  agentUsername: string;
  taskId: string;
  taskTitle: string;
  submission_url?: string;
};

export type CreateSubmissionResponse = {
  data: Submission;
};

export async function createSubmission(
  input: CreateSubmissionInput,
): Promise<CreateSubmissionResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      id: generateId(),
      task_id: input.taskId,
      agent_id: input.agentId,
      submission_url: input.submission_url?.trim() || null,
    })
    .select(SUBMISSION_SELECT)
    .single();

  if (error) throw error;

  const { error: taskError } = await supabase
    .from("tasks")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", input.taskId);

  if (taskError) throw taskError;

  revalidateTag(`submissions-${input.taskId}`, "max");
  revalidateTag(`task-${input.taskId}`, "max");
  revalidateTag("tasks", "max");

  broadcast(
    ["platform:submissions", `task:${input.taskId}:submissions`],
    "INSERT",
    data as Submission,
  );

  insertActivity({
    agentId: input.agentId,
    agentName: input.agentName,
    agentUsername: input.agentUsername,
    action: "submit",
    targetType: "task",
    targetId: input.taskId,
    targetLabel: input.taskTitle,
  });

  return { data: data as Submission };
}

export async function saveSubmissionWorkflowRunId(
  submissionId: string,
  runId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("submissions")
    .update({ workflow_run_id: runId })
    .eq("id", submissionId);

  if (error) throw error;
}

export async function getSubmissionReviewContext(
  submissionId: string,
): Promise<SubmissionReviewContext | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `${SUBMISSION_SELECT}, task:tasks!submissions_task_id_fkey(id, title, description, size, deliverable_type, status, target_type, target_id, target_name, credit_value)`,
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.task) return null;

  return {
    submission: {
      ...(data as Submission),
      status: (data.status as SubmissionStatus) ?? "pending",
    },
    task: data.task as SubmissionReviewContext["task"],
  };
}

export type ApproveSubmissionInput = {
  submissionId: string;
  reviewNotes: string;
};

export async function approveSubmission(
  input: ApproveSubmissionInput,
): Promise<void> {
  const supabase = createAdminClient();
  const context = await getSubmissionReviewContext(input.submissionId);

  if (!context) {
    throw new Error(`Submission ${input.submissionId} not found`);
  }

  const now = new Date().toISOString();
  const { data: existingCredit, error: creditLookupError } = await supabase
    .from("credits")
    .select("id")
    .eq("task_id", context.task.id)
    .maybeSingle();

  if (creditLookupError) throw creditLookupError;

  if (
    existingCredit &&
    context.submission.status === "approved" &&
    context.task.status === "approved"
  ) {
    return;
  }

  if (!existingCredit) {
    const { error: creditError } = await supabase.from("credits").insert({
      id: generateId(),
      agent_id: context.submission.agent_id,
      task_id: context.task.id,
      amount: getCreditAmount(context.task),
    });

    if (creditError) throw creditError;
  }

  const { error: submissionError } = await supabase
    .from("submissions")
    .update({
      status: "approved",
      review_notes: input.reviewNotes,
      reviewed_at: now,
    })
    .eq("id", input.submissionId)
    .in("status", ["pending", "approved"]);

  if (submissionError) throw submissionError;

  const { error: taskError } = await supabase
    .from("tasks")
    .update({
      status: "approved",
      updated_at: now,
  })
  .eq("id", context.task.id);

  if (taskError) throw taskError;

  if (context.submission.agent) {
    insertActivity({
      agentId: context.submission.agent_id,
      agentName: context.submission.agent.name,
      agentUsername: context.submission.agent.username,
      action: "approve",
      targetType: "task",
      targetId: context.task.id,
      targetLabel: context.task.title,
      ...(context.task.target_type === "product" && context.task.target_id && context.task.target_name
        ? {
            secondaryTargetType: context.task.target_type,
            secondaryTargetId: context.task.target_id,
            secondaryTargetLabel: context.task.target_name,
          }
        : {}),
    });
  }

  await refreshSubmissionState(supabase, context.task.id, input.submissionId);
}

export type RejectSubmissionInput = {
  submissionId: string;
  reviewNotes: string;
};

export async function rejectSubmission(
  input: RejectSubmissionInput,
): Promise<void> {
  const supabase = createAdminClient();
  const context = await getSubmissionReviewContext(input.submissionId);

  if (!context) {
    throw new Error(`Submission ${input.submissionId} not found`);
  }

  const now = new Date().toISOString();

  const { error: submissionError } = await supabase
    .from("submissions")
    .update({
      status: "rejected",
      review_notes: input.reviewNotes,
      reviewed_at: now,
    })
    .eq("id", input.submissionId);

  if (submissionError) throw submissionError;

  if (context.submission.agent) {
    insertActivity({
      agentId: context.submission.agent_id,
      agentName: context.submission.agent.name,
      agentUsername: context.submission.agent.username,
      action: "reject",
      targetType: "task",
      targetId: context.task.id,
      targetLabel: context.task.title,
      ...(context.task.target_type === "product" && context.task.target_id && context.task.target_name
        ? {
            secondaryTargetType: context.task.target_type,
            secondaryTargetId: context.task.target_id,
            secondaryTargetLabel: context.task.target_name,
          }
        : {}),
    });
  }

  const { error: taskError } = await supabase
    .from("tasks")
    .update({
      status: "open",
      claimed_by: null,
      claimed_at: null,
      updated_at: now,
    })
    .eq("id", context.task.id);

  if (taskError) throw taskError;

  await refreshSubmissionState(supabase, context.task.id, input.submissionId);
}

export type MarkSubmissionReviewFailedInput = {
  submissionId: string;
  reviewNotes: string;
};

export async function markSubmissionReviewFailed(
  input: MarkSubmissionReviewFailedInput,
): Promise<void> {
  const supabase = createAdminClient();
  const context = await getSubmissionReviewContext(input.submissionId);

  if (!context) {
    throw new Error(`Submission ${input.submissionId} not found`);
  }

  const now = new Date().toISOString();

  const { error: submissionError } = await supabase
    .from("submissions")
    .update({
      status: "rejected",
      review_notes: input.reviewNotes,
      reviewed_at: now,
    })
    .eq("id", input.submissionId);

  if (submissionError) throw submissionError;

  const { error: taskError } = await supabase
    .from("tasks")
    .update({
      status: "open",
      claimed_by: null,
      claimed_at: null,
      updated_at: now,
    })
    .eq("id", context.task.id);

  if (taskError) throw taskError;

  await refreshSubmissionState(supabase, context.task.id, input.submissionId);
}

// ======================================================
// BlockTask
// ======================================================

export type BlockTaskInput = {
  taskId: string;
  agentId: string;
  reason: string;
};

export type BlockTaskResponse = {
  data: Task;
};

export async function blockTask(
  input: BlockTaskInput,
): Promise<BlockTaskResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "blocked",
      blocked_reason: input.reason.trim(),
      claimed_by: null,
      claimed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId)
    .in("status", ["open", "claimed"])
    .select(TASK_SELECT)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("TASK_NOT_BLOCKABLE");
  }

  revalidateTag(`task-${input.taskId}`, "max");
  revalidateTag("tasks", "max");

  broadcast("platform:tasks", "UPDATE", data as Task);

  const task = data as Task;
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, username")
    .eq("id", input.agentId)
    .maybeSingle();

  if (agent) {
    insertActivity({
      agentId: agent.id,
      agentName: agent.name,
      agentUsername: agent.username,
      action: "block",
      targetType: "task",
      targetId: task.id,
      targetLabel: task.title,
    });
  }

  return { data: task };
}

// ======================================================
// DeleteTask
// ======================================================

export type DeleteTaskInput = string;

export async function deleteTask(taskId: DeleteTaskInput): Promise<void> {
  // Use session client so RLS enforces the permission
  const supabase = await createClient();

  // Fetch task details before deleting (for logging)
  const admin = createAdminClient();
  const { data: task } = await admin
    .from("tasks")
    .select("id, title, created_by, target_type, target_id")
    .eq("id", taskId)
    .maybeSingle();

  // Cascade-delete child entities (comments, reactions, submissions, credits, activity)
  const { error: cascadeError } = await admin.rpc("cascade_delete_task", {
    p_task_id: taskId,
  });
  if (cascadeError) {
    console.error("[deleteTask] Cascade cleanup failed:", cascadeError);
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;

  revalidateTag("tasks", "max");
  revalidateTag("products", "max");
  if (task) {
    revalidateTag(`task-${taskId}`, "max");
    if (task.target_type === "product" && task.target_id) {
      revalidateTag(`product-${task.target_id}`, "max");
    }
  }

  broadcast("platform:tasks", "DELETE", { id: taskId });

  slackLog(`Admin deleted task: "${task?.title ?? taskId}"`);
}
