// -- Types --

type PRDetails = {
  owner: string;
  repo: string;
  prNumber: number;
  sha: string;
  diff: string;
  state: "open" | "merged" | "closed" | "invalid";
};

type ReviewResult = {
  approved: boolean;
  reason: string;
};

// -- Step functions --

async function fetchAndValidatePR(prUrl: string): Promise<PRDetails> {
  "use step";
  const { parsePrUrl, getReviewBotOctokit } = await import("@/lib/github");

  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    return {
      owner: "",
      repo: "",
      prNumber: 0,
      sha: "",
      diff: "",
      state: "invalid",
    };
  }

  const { owner, repo, prNumber } = parsed;
  const octokit = await getReviewBotOctokit();

  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });

  if (pr.merged) {
    return { owner, repo, prNumber, sha: pr.head.sha, diff: "", state: "merged" };
  }
  if (pr.state === "closed") {
    return { owner, repo, prNumber, sha: pr.head.sha, diff: "", state: "closed" };
  }

  // Fetch diff
  const { data: diff } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  });

  // Set pending commit status
  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha: pr.head.sha,
    state: "pending",
    context: "moltcorp/review-bot",
    description: "Review in progress...",
  });

  return {
    owner,
    repo,
    prNumber,
    sha: pr.head.sha,
    diff: diff as unknown as string,
    state: "open",
  };
}

async function reviewCode(
  _diff: string,
  _metadata: { owner: string; repo: string; prNumber: number },
): Promise<ReviewResult> {
  "use step";
  // Placeholder — auto-approve everything for now
  // Future: AI SDK call to review the diff
  return { approved: true, reason: "Auto-approved (review bot placeholder)" };
}

async function applyResult(
  submissionId: string,
  pr: PRDetails,
  review: ReviewResult,
): Promise<void> {
  "use step";
  const { getReviewBotOctokit } = await import("@/lib/github");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { revalidateTag } = await import("next/cache");
  const supabase = createAdminClient();

  // Get the submission's task_id and agent_id for cache invalidation
  const { data: submission } = await supabase
    .from("submissions")
    .select("task_id, agent_id")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const taskId = submission.task_id;

  // Handle already-merged or closed/invalid PRs
  if (pr.state === "merged") {
    // PR was already merged — just accept the submission
    const { error } = await supabase.rpc("accept_submission", {
      p_submission_id: submissionId,
      p_review_notes: "PR was already merged",
    });
    if (error) throw new Error(`Failed to accept submission: ${error.message}`);
    revalidateTag("tasks", "max");
    revalidateTag(`task-${taskId}`, "max");
    revalidateTag("activity", "max");
    revalidateTag("credits", "max");
    revalidateTag(`agent-${submission.agent_id}`, "max");
    return;
  }

  if (pr.state === "closed") {
    await supabase
      .from("submissions")
      .update({ status: "rejected", review_notes: "PR is closed" })
      .eq("id", submissionId);
    revalidateTag(`task-${taskId}`, "max");
    return;
  }

  if (pr.state === "invalid") {
    await supabase
      .from("submissions")
      .update({ status: "rejected", review_notes: "Invalid PR URL or wrong organization" })
      .eq("id", submissionId);
    revalidateTag(`task-${taskId}`, "max");
    return;
  }

  // PR is open — apply review result
  const octokit = await getReviewBotOctokit();
  const { owner, repo, prNumber, sha } = pr;

  if (review.approved) {
    // Leave a comment (can't use APPROVE review — same App identity opened the PR)
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `**Review passed** — ${review.reason}`,
    });

    // Merge the PR
    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: "squash",
    });

    // Accept the submission via RPC (handles credits, task completion, etc.)
    const { error } = await supabase.rpc("accept_submission", {
      p_submission_id: submissionId,
      p_review_notes: review.reason,
    });
    if (error) throw new Error(`Failed to accept submission: ${error.message}`);

    // Set success commit status
    await octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state: "success",
      context: "moltcorp/review-bot",
      description: "Review passed — merged",
    });

    revalidateTag("tasks", "max");
    revalidateTag(`task-${taskId}`, "max");
    revalidateTag("activity", "max");
    revalidateTag("credits", "max");
    revalidateTag(`agent-${submission.agent_id}`, "max");
  } else {
    // Leave a comment with rejection reason
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `**Changes requested** — ${review.reason}`,
    });

    // Reject the submission
    await supabase
      .from("submissions")
      .update({ status: "rejected", review_notes: review.reason })
      .eq("id", submissionId);

    // Set failure commit status
    await octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state: "failure",
      context: "moltcorp/review-bot",
      description: "Review failed — changes requested",
    });

    revalidateTag(`task-${taskId}`, "max");
  }
}

// -- Workflow function --

export async function reviewSubmissionWorkflow(
  submissionId: string,
  prUrl: string,
) {
  "use workflow";

  const pr = await fetchAndValidatePR(prUrl);
  const review = await reviewCode(pr.diff, {
    owner: pr.owner,
    repo: pr.repo,
    prNumber: pr.prNumber,
  });
  await applyResult(submissionId, pr, review);
}
