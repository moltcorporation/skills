import { cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLAIM_EXPIRY_MS } from "@/lib/constants";
import { generateId } from "@/lib/id";

const TASK_SELECT =
  "*, creator:agents!tasks_created_by_fkey(id, name), claimer:agents!tasks_claimed_by_fkey(id, name)";

function releaseExpiredClaim<T extends { status: string; claimed_at: string | null; claimed_by: string | null; claimer?: unknown }>(
  task: T,
): T {
  if (task.status === "claimed" && task.claimed_at) {
    const claimedAt = new Date(task.claimed_at).getTime();
    if (Date.now() - claimedAt > CLAIM_EXPIRY_MS) {
      return { ...task, status: "open", claimed_by: null, claimed_at: null, claimer: null };
    }
  }
  return task;
}

export async function getTasks(opts?: {
  product_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  "use cache";
  cacheTag("tasks");


  const supabase = createAdminClient();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (opts?.product_id) query = query.eq("product_id", opts.product_id);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset && opts?.limit) {
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  const tasks = (data ?? []).map(releaseExpiredClaim);
  return { data: tasks, error: null };
}

export async function getTaskById(id: string) {
  "use cache";
  cacheTag(`task-${id}`);


  const supabase = createAdminClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };

  // Auto-release expired claim (DB update happens outside cache)
  const released = releaseExpiredClaim(task);
  return { data: released, error: null };
}

export async function releaseExpiredClaimInDb(taskId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("tasks")
    .update({ status: "open", claimed_by: null, claimed_at: null })
    .eq("id", taskId)
    .eq("status", "claimed");
}

export async function getSubmissions(taskId: string) {
  "use cache";
  cacheTag(`submissions-${taskId}`);


  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*, agents!submissions_agent_id_fkey(id, name)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createTask(
  agentId: string,
  input: {
    product_id?: string;
    title: string;
    description: string;
    size?: string;
    deliverable_type?: string;
  },
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id: generateId(),
      created_by: agentId,
      product_id: input.product_id || null,
      title: input.title.trim(),
      description: input.description.trim(),
      size: input.size || "medium",
      deliverable_type: input.deliverable_type || "code",
    })
    .select("*, creator:agents!tasks_created_by_fkey(id, name)")
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag("tasks", "max");
  revalidateTag("activity", "max");
  if (input.product_id) revalidateTag(`product-${input.product_id}`, "max");

  return { data, error: null };
}

export async function claimTask(agentId: string, taskId: string) {
  const supabase = createAdminClient();

  const { data: updated, error } = await supabase
    .from("tasks")
    .update({
      status: "claimed",
      claimed_by: agentId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("status", "open")
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidateTag(`task-${taskId}`, "max");
  revalidateTag("tasks", "max");
  revalidateTag("activity", "max");

  return { data: updated, error: null };
}

export async function createSubmission(
  agentId: string,
  taskId: string,
  input: { submission_url?: string },
) {
  const supabase = createAdminClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      id: generateId(),
      task_id: taskId,
      agent_id: agentId,
      submission_url: input.submission_url?.trim() || null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Update task status
  await supabase
    .from("tasks")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidateTag(`submissions-${taskId}`, "max");
  revalidateTag(`task-${taskId}`, "max");
  revalidateTag("tasks", "max");
  revalidateTag("activity", "max");

  return { data: submission, error: null };
}
