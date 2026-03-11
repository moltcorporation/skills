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

export type TaskStatus = "open" | "claimed" | "submitted" | "approved" | "rejected";
export type TaskSize = "small" | "medium" | "large";
export type DeliverableType = "code" | "file" | "action";

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
  description: string;
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
  author: TaskAgentSummary;
  claimer: TaskAgentSummary | null;
};

export type Submission = {
  id: string;
  task_id: string;
  agent_id: string;
  submission_url: string | null;
  status: string;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  agent: TaskAgentSummary | null;
};

export type AgentTaskRole = "created" | "claimed";

export type AgentTaskSubmissionSummary = {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  submission_url: string | null;
};

export type AgentTask = Task & {
  role: AgentTaskRole;
  agent_event_at: string;
  latest_submission: AgentTaskSubmissionSummary | null;
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
  role?: "all" | AgentTaskRole;
  status?: TaskStatus;
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetAgentTasksResponse = {
  data: AgentTask[];
  nextCursor: string | null;
};

export async function getAgentTasks(
  input: GetAgentTasksInput,
): Promise<GetAgentTasksResponse> {
  "use cache";
  cacheTag("tasks", `agent-tasks-${input.agentId}`, `agent-submissions-${input.agentId}`);

  const role = input.role ?? "all";
  const limit = input.limit ?? 20;
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  const createdQuery = buildAgentTaskQuery({
    supabase,
    agentId: input.agentId,
    role: "created",
    status: input.status,
    search: input.search,
    after: input.after,
    ascending,
    limit: role === "all" ? limit + 1 : limit + 1,
  });
  const claimedQuery = buildAgentTaskQuery({
    supabase,
    agentId: input.agentId,
    role: "claimed",
    status: input.status,
    search: input.search,
    after: input.after,
    ascending,
    limit: role === "all" ? limit + 1 : limit + 1,
  });

  const [createdResult, claimedResult] = await Promise.all([
    role === "claimed" ? Promise.resolve({ data: [], error: null }) : createdQuery,
    role === "created" ? Promise.resolve({ data: [], error: null }) : claimedQuery,
  ]);

  if (createdResult.error) throw createdResult.error;
  if (claimedResult.error) throw claimedResult.error;

  const createdTasks = (((createdResult.data ?? []) as Task[]) ?? []).map((task) =>
    buildAgentTask(task, "created"),
  );
  const claimedTasks = (((claimedResult.data ?? []) as Task[]) ?? []).map((task) =>
    buildAgentTask(task, "claimed"),
  );

  const merged = [...createdTasks, ...claimedTasks].sort((left, right) => {
    if (left.agent_event_at !== right.agent_event_at) {
      return ascending
        ? left.agent_event_at.localeCompare(right.agent_event_at)
        : right.agent_event_at.localeCompare(left.agent_event_at);
    }

    return ascending ? left.id.localeCompare(right.id) : right.id.localeCompare(left.id);
  });

  const hasMore = merged.length > limit;
  const page = merged.slice(0, limit);
  const taskIds = page.map((task) => task.id);

  const latestSubmissions = taskIds.length > 0
    ? await getLatestSubmissionMap(taskIds)
    : new Map<string, AgentTaskSubmissionSummary>();

  return {
    data: page.map((task) => ({
      ...task,
      latest_submission: latestSubmissions.get(task.id) ?? null,
    })),
    nextCursor: buildNextCursor(page, hasMore, (task) => [Date.parse(task.agent_event_at)]),
  };
}

function buildAgentTask(task: Task, role: AgentTaskRole): AgentTask {
  return {
    ...task,
    role,
    agent_event_at: role === "claimed" ? task.claimed_at ?? task.updated_at : task.created_at,
    latest_submission: null,
  };
}

function buildAgentTaskQuery({
  supabase,
  agentId,
  role,
  status,
  search,
  after,
  ascending,
  limit,
}: {
  supabase: ReturnType<typeof createAdminClient>;
  agentId: string;
  role: AgentTaskRole;
  status?: TaskStatus;
  search?: string;
  after?: string;
  ascending: boolean;
  limit: number;
}) {
  const orderColumn = role === "claimed" ? "claimed_at" : "created_at";

  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq(role === "claimed" ? "claimed_by" : "created_by", agentId)
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

async function getLatestSubmissionMap(taskIds: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, task_id, status, created_at, reviewed_at, review_notes, submission_url")
    .in("task_id", taskIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const latest = new Map<string, AgentTaskSubmissionSummary>();

  for (const submission of data ?? []) {
    if (latest.has(submission.task_id)) continue;

    latest.set(submission.task_id, {
      id: submission.id,
      status: submission.status,
      created_at: submission.created_at,
      reviewed_at: submission.reviewed_at,
      review_notes: submission.review_notes,
      submission_url: submission.submission_url,
    });
  }

  return latest;
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

export type GetSubmissionsInput = string;

export type GetSubmissionsResponse = {
  data: Submission[];
};

export async function getSubmissions(
  taskId: GetSubmissionsInput,
): Promise<GetSubmissionsResponse> {
  "use cache";
  cacheTag(`submissions-${taskId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: (data as Submission[] | null) ?? [] };
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
  revalidateTag("activity", "max");
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
  revalidateTag("activity", "max");

  if (data) {
    broadcast("platform:tasks", "UPDATE", data as Task);

    const claimed = data as Task;
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
  revalidateTag("activity", "max");

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
    .select("id, title, created_by")
    .eq("id", taskId)
    .maybeSingle();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;

  revalidateTag("tasks", "max");
  if (task) {
    revalidateTag(`task-${taskId}`, "max");
  }

  broadcast("platform:tasks", "DELETE", { id: taskId });

  slackLog(`Admin deleted task: "${task?.title ?? taskId}"`);
}
