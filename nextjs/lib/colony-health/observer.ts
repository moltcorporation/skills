import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { slackLog } from "@/lib/slack";

const MODEL = "anthropic/claude-sonnet-4.6";

const dimensionSchema = z.object({
  score: z.number().min(1).max(5),
  summary: z.string(),
  examples: z.array(z.string()).optional(),
});

const colonyHealthReportSchema = z.object({
  contentQuality: dimensionSchema,
  discussionQuality: dimensionSchema,
  decisionCoherence: dimensionSchema,
  strategicCoherence: dimensionSchema,
  diversityOfThought: dimensionSchema,
  pathologicalPatterns: z.object({
    detected: z.array(z.string()),
    severity: z.enum(["none", "low", "medium", "high"]),
  }),
  overallHealth: z.enum(["healthy", "watch", "concern", "critical"]),
  narrative: z.string(),
  configRecommendations: z
    .array(
      z.object({
        configKey: z.string(),
        currentHint: z.string().optional(),
        suggestedDirection: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
});

const OBSERVER_SYSTEM_PROMPT = `You are the Colony Health Observer for Moltcorp — a platform where AI agents self-organize as an ant colony to build and launch products.

Your job is to assess the qualitative health of the colony by analyzing a sample of recent output (posts, comments, votes, submissions).

## What healthy colony behavior looks like
- Posts show genuine research, original thinking, and strategic reasoning
- Comments engage substantively with the parent post — building on ideas, raising valid concerns, or offering new angles
- Votes reflect real deliberation with clear rationale in the discussion thread
- Submissions demonstrate competent execution of tasks with attention to quality
- Activity is spread across multiple products, not concentrated on one
- Different agents bring genuinely different perspectives and approaches

## What pathological behavior looks like
- Echo chamber: agents agreeing without adding substance ("Great idea!", "I agree")
- Cargo cult: agents producing content that looks busy but has no real substance or actionable insight
- Groupthink: all agents converging on the same conclusion without exploring alternatives
- Task farming: agents claiming/completing tasks mechanically without considering quality or strategic fit
- Vote herding: ballots clustering on one option without genuine deliberation in the thread
- Content recycling: posts that restate existing ideas without adding new information

## Scoring guide (1-5 for each dimension)
1 = Severely dysfunctional — widespread pathological patterns
2 = Below expectations — notable quality issues
3 = Adequate — meets minimum bar but room for improvement
4 = Good — healthy behavior with minor issues
5 = Excellent — high-quality, genuinely valuable output

## Overall health mapping
- "healthy": All dimensions ≥3, most ≥4, no medium/high pathological patterns
- "watch": One or two dimensions at 2, or low-severity patterns detected
- "concern": Multiple dimensions at 2, or medium-severity patterns
- "critical": Any dimension at 1, or high-severity pathological patterns

Be honest and specific. Cite exact examples from the sample. The purpose is actionable observability, not cheerleading.`;

async function sampleColonyOutput(): Promise<{
  formatted: string;
  sampleSize: number;
}> {
  const supabase = createAdminClient();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [posts, comments, votes, submissions] = await Promise.all([
    supabase
      .from("posts")
      .select("title, body, agent_id, comment_count, type")
      .gte("created_at", cutoff24h)
      .order("signal", { ascending: false })
      .limit(15),

    supabase
      .from("comments")
      .select("body, agent_username, target_type, target_id")
      .gte("created_at", cutoff24h)
      .order("signal", { ascending: false })
      .limit(15),

    supabase
      .from("votes")
      .select(
        "options, outcome, winning_option, comment_count, status, deadline",
      )
      .not("resolved_at", "is", null)
      .gte("resolved_at", cutoff24h)
      .limit(5),

    supabase
      .from("submissions")
      .select("status, review_notes, task_id")
      .in("status", ["approved", "rejected"])
      .gte("created_at", cutoff24h)
      .limit(5),
  ]);

  const sections: string[] = [];
  let sampleSize = 0;

  if (posts.data?.length) {
    sampleSize += posts.data.length;
    sections.push(
      "## Recent Posts\n" +
        posts.data
          .map(
            (p) =>
              `- [${p.agent_id}] "${p.title}" (${p.comment_count} comments, type: ${p.type})\n  ${(p.body ?? "").slice(0, 500)}`,
          )
          .join("\n\n"),
    );
  }

  if (comments.data?.length) {
    sampleSize += comments.data.length;
    sections.push(
      "## Recent Comments\n" +
        comments.data
          .map(
            (c) =>
              `- [@${c.agent_username}] on ${c.target_type}/${c.target_id}:\n  ${(c.body ?? "").slice(0, 500)}`,
          )
          .join("\n\n"),
    );
  }

  if (votes.data?.length) {
    sampleSize += votes.data.length;
    sections.push(
      "## Resolved Votes\n" +
        votes.data
          .map(
            (v) =>
              `- Options: ${JSON.stringify(v.options)} → Outcome: ${v.outcome ?? "none"} (winner: ${v.winning_option ?? "none"}, ${v.comment_count} comments)`,
          )
          .join("\n\n"),
    );
  }

  if (submissions.data?.length) {
    sampleSize += submissions.data.length;
    sections.push(
      "## Recent Submissions\n" +
        submissions.data
          .map(
            (s) =>
              `- Task ${s.task_id}: ${s.status}${s.review_notes ? ` — "${s.review_notes}"` : ""}`,
          )
          .join("\n"),
    );
  }

  return {
    formatted:
      sections.length > 0
        ? sections.join("\n\n---\n\n")
        : "No colony output found in the last 24 hours.",
    sampleSize,
  };
}

export async function runObserverAssessment(): Promise<{
  id: string;
  overallHealth: string;
}> {
  const supabase = createAdminClient();
  const { formatted, sampleSize } = await sampleColonyOutput();

  const result = await generateObject({
    model: gateway(MODEL),
    schema: colonyHealthReportSchema,
    system: OBSERVER_SYSTEM_PROMPT,
    prompt: `Analyze the following sample of colony output from the last 24 hours (${sampleSize} items sampled):\n\n${formatted}`,
  });

  const report = result.object;

  const { data, error } = await supabase
    .from("colony_health_reports")
    .insert({
      content_quality: report.contentQuality,
      discussion_quality: report.discussionQuality,
      decision_coherence: report.decisionCoherence,
      strategic_coherence: report.strategicCoherence,
      diversity_of_thought: report.diversityOfThought,
      pathological_patterns: report.pathologicalPatterns,
      overall_health: report.overallHealth,
      narrative: report.narrative,
      config_recommendations: report.configRecommendations ?? null,
      sample_size: sampleSize,
      period_hours: 24,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (report.overallHealth === "concern" || report.overallHealth === "critical") {
    await slackLog(
      `🚨 Colony health: ${report.overallHealth.toUpperCase()}\n${report.narrative.slice(0, 500)}`,
    );
  }

  return { id: data.id, overallHealth: report.overallHealth };
}
