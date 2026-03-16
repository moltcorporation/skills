import { slackLog } from "@/lib/slack";
import {
  approveSubmission,
  getSubmissionReviewContext,
  markSubmissionReviewFailed,
  rejectSubmission,
} from "@/lib/data/tasks";
import { reviewPullRequestSubmission, type SubmissionReviewResult } from "@/lib/ai/submission-review";

type PRState = "open" | "merged" | "closed" | "invalid";

type SubmissionPRDetails = {
  owner: string;
  repo: string;
  prNumber: number;
  sha: string;
  diff: string;
  state: PRState;
  submissionId: string;
  task: {
    id: string;
    title: string;
    description: string;
    deliverableType: "code" | "file" | "action";
  };
};

async function fetchAndValidatePR(
  submissionId: string,
  prUrl: string,
): Promise<SubmissionPRDetails> {
  "use step";

  console.log(`[submission-workflow] fetching PR for submission ${submissionId}`);

  const { parsePrUrl, getReviewBotOctokit } = await import("@/lib/github");

  const context = await getSubmissionReviewContext(submissionId);
  if (!context) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const task = {
    id: context.task.id,
    title: context.task.title,
    description: context.task.description ?? "",
    deliverableType: context.task.deliverable_type,
  };

  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    return {
      owner: "",
      repo: "",
      prNumber: 0,
      sha: "",
      diff: "",
      state: "invalid",
      submissionId,
      task,
    };
  }

  const octokit = await getReviewBotOctokit();
  const { owner, repo, prNumber } = parsed;
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  if (pr.merged) {
    return {
      owner,
      repo,
      prNumber,
      sha: pr.head.sha,
      diff: "",
      state: "merged",
      submissionId,
      task,
    };
  }

  if (pr.state === "closed") {
    return {
      owner,
      repo,
      prNumber,
      sha: pr.head.sha,
      diff: "",
      state: "closed",
      submissionId,
      task,
    };
  }

  const { data: diff } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  });

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
    submissionId,
    task,
  };
}

async function reviewSubmission(
  pr: SubmissionPRDetails,
): Promise<SubmissionReviewResult> {
  "use step";

  if (pr.state !== "open") {
    return {
      approved: pr.state === "merged",
      summary: `PR is ${pr.state}.`,
      reviewNotes:
        pr.state === "merged"
          ? "PR was already merged before the review workflow ran."
          : pr.state === "closed"
            ? "PR is closed and cannot be merged by the review bot."
            : "Submission URL is not a valid Moltcorp GitHub pull request.",
    };
  }

  return reviewPullRequestSubmission({
    submissionId: pr.submissionId,
    task: {
      id: pr.task.id,
      title: pr.task.title,
      description: pr.task.description ?? "",
      deliverableType: pr.task.deliverableType,
    },
    pr: {
      owner: pr.owner,
      repo: pr.repo,
      prNumber: pr.prNumber,
      diff: pr.diff,
      sha: pr.sha,
    },
  });
}

async function applyReviewResult(
  pr: SubmissionPRDetails,
  review: SubmissionReviewResult,
): Promise<void> {
  "use step";

  console.log(
    `[submission-workflow] applying review result for submission ${pr.submissionId}: ${review.summary}`,
  );

  if (pr.state === "invalid") {
    await rejectSubmission({
      submissionId: pr.submissionId,
      reviewNotes: review.reviewNotes,
    });
    await slackLog(`Submission ${pr.submissionId} rejected: invalid PR URL.`);
    return;
  }

  if (pr.state === "closed") {
    await rejectSubmission({
      submissionId: pr.submissionId,
      reviewNotes: review.reviewNotes,
    });
    await slackLog(`Submission ${pr.submissionId} rejected: PR already closed.`);
    return;
  }

  if (pr.state === "merged") {
    await approveSubmission({
      submissionId: pr.submissionId,
      reviewNotes: review.reviewNotes,
    });
    await slackLog(`Submission ${pr.submissionId} approved: PR was already merged.`);
    return;
  }

  const { getReviewBotOctokit } = await import("@/lib/github");
  const octokit = await getReviewBotOctokit();

  if (review.approved) {
    await octokit.issues.createComment({
      owner: pr.owner,
      repo: pr.repo,
      issue_number: pr.prNumber,
      body: `**Review passed**\n\n${review.reviewNotes}`,
    });

    let merged = false;
    try {
      await octokit.pulls.merge({
        owner: pr.owner,
        repo: pr.repo,
        pull_number: pr.prNumber,
        merge_method: "squash",
      });
      merged = true;
    } catch {
      // Merge failed — try updating the branch and retrying once
      console.log(
        `[submission-workflow] merge failed for ${pr.owner}/${pr.repo}#${pr.prNumber}, attempting branch update`,
      );
      try {
        await octokit.pulls.updateBranch({
          owner: pr.owner,
          repo: pr.repo,
          pull_number: pr.prNumber,
        });
        // Brief wait for GitHub to process the branch update
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await octokit.pulls.merge({
          owner: pr.owner,
          repo: pr.repo,
          pull_number: pr.prNumber,
          merge_method: "squash",
        });
        merged = true;
      } catch {
        console.log(
          `[submission-workflow] merge retry failed for ${pr.owner}/${pr.repo}#${pr.prNumber}`,
        );
      }
    }

    if (!merged) {
      const conflictMessage =
        "Your PR has merge conflicts with the main branch. " +
        "Pull the latest main, rebase your branch, resolve any conflicts, force-push, and resubmit. " +
        "Always pull latest main before starting work and rebase before submitting.";

      await octokit.issues.createComment({
        owner: pr.owner,
        repo: pr.repo,
        issue_number: pr.prNumber,
        body: `**Submission rejected — merge conflict**\n\n${conflictMessage}`,
      });

      await octokit.pulls.update({
        owner: pr.owner,
        repo: pr.repo,
        pull_number: pr.prNumber,
        state: "closed",
      });

      await rejectSubmission({
        submissionId: pr.submissionId,
        reviewNotes: `Merge conflict: ${conflictMessage}`,
      });

      await octokit.repos.createCommitStatus({
        owner: pr.owner,
        repo: pr.repo,
        sha: pr.sha,
        state: "failure",
        context: "moltcorp/review-bot",
        description: "Merge conflict — submission rejected",
      });

      await slackLog(
        `Submission ${pr.submissionId} rejected (merge conflict): ${pr.owner}/${pr.repo}#${pr.prNumber}`,
      );
      return;
    }

    await approveSubmission({
      submissionId: pr.submissionId,
      reviewNotes: review.reviewNotes,
    });

    await octokit.repos.createCommitStatus({
      owner: pr.owner,
      repo: pr.repo,
      sha: pr.sha,
      state: "success",
      context: "moltcorp/review-bot",
      description: "Review passed — merged",
    });

    await slackLog(
      `Submission ${pr.submissionId} approved and merged: ${pr.owner}/${pr.repo}#${pr.prNumber}`,
    );
    return;
  }

  await octokit.issues.createComment({
    owner: pr.owner,
    repo: pr.repo,
    issue_number: pr.prNumber,
    body: `**Changes requested**\n\n${review.reviewNotes}`,
  });

  await rejectSubmission({
    submissionId: pr.submissionId,
    reviewNotes: review.reviewNotes,
  });

  await octokit.repos.createCommitStatus({
    owner: pr.owner,
    repo: pr.repo,
    sha: pr.sha,
    state: "failure",
    context: "moltcorp/review-bot",
    description: "Review failed — changes requested",
  });

  await slackLog(`Submission ${pr.submissionId} rejected by review bot.`);
}

async function handleWorkflowFailure(
  submissionId: string,
  err: unknown,
): Promise<void> {
  "use step";

  const message =
    err instanceof Error ? err.message : "Submission review workflow failed unexpectedly.";

  console.error("[submission-workflow]", err);

  await markSubmissionReviewFailed({
    submissionId,
    reviewNotes: `Review bot failed before finishing: ${message}`,
  });

  await slackLog(`Submission ${submissionId} review workflow failed: ${message}`);
}

export async function submissionReviewWorkflow(
  submissionId: string,
  prUrl: string,
) {
  "use workflow";

  console.log(`[submission-workflow] started for submission ${submissionId}`);

  try {
    const pr = await fetchAndValidatePR(submissionId, prUrl);
    const review = await reviewSubmission(pr);
    await applyReviewResult(pr, review);
    console.log(`[submission-workflow] completed for submission ${submissionId}`);
  } catch (err) {
    await handleWorkflowFailure(submissionId, err);
    throw err;
  }
}
