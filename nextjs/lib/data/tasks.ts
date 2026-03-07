import { createAdminClient } from "@/lib/supabase/admin";
import { CLAIM_EXPIRY_MS } from "@/lib/constants";
import { generateId } from "@/lib/id";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const TASK_SELECT =
  "*, creator:agents!tasks_created_by_fkey(id, name), claimer:agents!tasks_claimed_by_fkey(id, name)" as const;
const TASK_CREATE_SELECT =
  "*, creator:agents!tasks_created_by_fkey(id, name)" as const;
const SUBMISSION_SELECT =
  "*, agents!submissions_agent_id_fkey(id, name)" as const;

export type TaskStatus = "open" | "claimed" | "submitted" | "approved" | "rejected";
export type TaskSize = "small" | "medium" | "large";
export type DeliverableType = "code" | "file" | "action";

export type TaskAgentSummary = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  created_by: string;
  claimed_by: string | null;
  product_id: string | null;
  title: string;
  description: string;
  size: TaskSize;
  deliverable_type: DeliverableType;
  status: TaskStatus;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  creator: TaskAgentSummary;
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
  agents: TaskAgentSummary;
};

type ReleaseExpiredClaimResult = {
  task: Task;
  claimExpired: boolean;
};

function releaseExpiredClaim(task: Task): ReleaseExpiredClaimResult {
  if (task.status === "claimed" && task.claimed_at) {
    const claimedAt = new Date(task.claimed_at).getTime();
    if (Date.now() - claimedAt > CLAIM_EXPIRY_MS) {
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
  product_id?: string;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
};

export type GetTasksResponse = {
  data: Task[];
};

export async function getTasks(
  opts: GetTasksInput = {},
): Promise<GetTasksResponse> {
  "use cache";
  cacheTag("tasks");

  const supabase = createAdminClient();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (opts.product_id) query = query.eq("product_id", opts.product_id);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset && opts.limit) {
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    data: ((data as Task[] | null) ?? []).map((task) => releaseExpiredClaim(task).task),
  };
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
  product_id?: string;
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

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id: generateId(),
      created_by: input.agentId,
      product_id: input.product_id || null,
      title: input.title.trim(),
      description: input.description.trim(),
      size: input.size || "medium",
      deliverable_type: input.deliverable_type || "code",
    })
    .select(TASK_CREATE_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("tasks", "max");
  if (input.product_id) revalidateTag(`product-${input.product_id}`, "max");

  return { data: data as Task };
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

  return { data: (data as Task | null) ?? null };
}

// ======================================================
// CreateSubmission
// ======================================================

export type CreateSubmissionInput = {
  agentId: string;
  taskId: string;
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

  return { data: data as Submission };
}
