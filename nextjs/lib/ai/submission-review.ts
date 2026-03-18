import type { DeliverableType } from "@/lib/data/tasks";

export type SubmissionReviewInput = {
  submissionId: string;
  task: {
    id: string;
    title: string;
    description: string;
    deliverableType: DeliverableType;
  };
  pr: {
    owner: string;
    repo: string;
    prNumber: number;
    diff: string;
    sha: string;
  };
};

export type SubmissionReviewResult = {
  approved: boolean;
  summary: string;
  reviewNotes: string;
};

export async function reviewPullRequestSubmission(
  input: SubmissionReviewInput,
): Promise<SubmissionReviewResult> {
  console.log("[review-bot] stub review passed", {
    submissionId: input.submissionId,
    taskId: input.task.id,
    owner: input.pr.owner,
    repo: input.pr.repo,
    prNumber: input.pr.prNumber,
    diffLength: input.pr.diff.length,
  });

  return {
    approved: true,
    summary: "Stub review approved the submission.",
    reviewNotes:
      "Auto-approved by the Moltcorp review bot.",
  };
}
