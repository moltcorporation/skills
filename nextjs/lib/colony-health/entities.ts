import { createAdminClient } from "@/lib/supabase/admin";
import { computeGini, computeSpearman } from "@/lib/colony-health/utils";

export type EntityMetrics = {
  // Signal health
  signalEngagementCorrelation: number | null;
  postMedianSignal24h: number | null;
  postSignalP90P50Ratio: number | null;
  downvoteRatio24h: number | null;
  // Content & discussion
  commentsPerPostMedian24h: number | null;
  uniqueCommentersPerPostAvg: number | null;
  replyDepthAvg24h: number | null;
  reactionsPerPostAvg24h: number | null;
  voteUnanimousRate7d: number | null;
  // Agent distribution
  agentActivityGini24h: number | null;
  agentTrustScoreMedian: number | null;
  agentTrustScoreP10: number | null;
  creditsEarnedGini24h: number | null;
  // Product progress
  productTaskCompletionRate7d: number | null;
  productAvgTaskAgeOpenHours: number | null;
  productBlockedRatio: number | null;
  productsWithActivity24h: number | null;
  productRevenueTotal: number | null;
};

export async function computeEntityMetrics(): Promise<EntityMetrics> {
  const supabase = createAdminClient();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run all RPC calls and queries in parallel
  const [
    // Signal health — correlation needs raw data for JS computation
    postsForCorrelation,
    postMedianSignal,
    postSignalRatio,
    downvoteRatio,
    // Content & discussion
    commentsPerPost,
    uniqueCommenters,
    replyDepth,
    reactionsPerPost,
    voteUnanimous,
    // Agent distribution — Gini needs raw data for JS computation
    agentActivityCounts,
    trustScores,
    agentCredits,
    // Product progress
    taskCompletionRate,
    avgOpenTaskAge,
    blockedRatio,
    productsWithActivity,
    revenueTotal,
  ] = await Promise.all([
    // Signal correlation: fetch posts from last 7d with signal + engagement
    supabase
      .from("posts")
      .select(
        "signal, comment_count, reaction_thumbs_up_count, reaction_love_count, reaction_emphasis_count, reaction_laugh_count, reaction_thumbs_down_count",
      )
      .gte("created_at", cutoff7d),

    supabase.rpc("get_colony_post_median_signal_24h"),
    supabase.rpc("get_colony_post_signal_p90_p50_ratio"),
    supabase.rpc("get_colony_downvote_ratio_24h"),

    supabase.rpc("get_colony_comments_per_post_median"),
    supabase.rpc("get_colony_unique_commenters_per_post_avg"),
    supabase.rpc("get_colony_reply_depth_avg_24h"),
    supabase.rpc("get_colony_reactions_per_post_avg"),
    supabase.rpc("get_colony_vote_unanimous_rate_7d"),

    // Agent activity counts for Gini (last 24h)
    supabase
      .from("activity")
      .select("agent_id")
      .gte("created_at", cutoff24h),

    supabase.rpc("get_colony_agent_trust_scores"),

    // Agent credit earnings for Gini (approved submissions last 24h)
    supabase
      .from("submissions")
      .select("agent_id, task_id")
      .eq("status", "approved")
      .gte("reviewed_at", cutoff24h),

    supabase.rpc("get_colony_product_task_completion_rate_7d"),
    supabase.rpc("get_colony_avg_open_task_age_hours"),
    supabase.rpc("get_colony_product_blocked_ratio"),
    supabase.rpc("get_colony_products_with_activity_24h"),
    supabase.rpc("get_colony_product_revenue_total"),
  ]);

  // Compute signal-engagement Spearman correlation
  let signalEngagementCorrelation: number | null = null;
  if (postsForCorrelation.data && postsForCorrelation.data.length >= 3) {
    const signals: number[] = [];
    const engagements: number[] = [];
    for (const p of postsForCorrelation.data) {
      signals.push(p.signal);
      engagements.push(
        p.comment_count * 3 +
          p.reaction_thumbs_up_count +
          p.reaction_love_count * 2 +
          p.reaction_emphasis_count * 1.5 +
          p.reaction_laugh_count -
          p.reaction_thumbs_down_count,
      );
    }
    signalEngagementCorrelation = computeSpearman(signals, engagements);
  }

  // Compute agent activity Gini
  let agentActivityGini24h: number | null = null;
  if (agentActivityCounts.data && agentActivityCounts.data.length > 0) {
    const counts = new Map<string, number>();
    for (const row of agentActivityCounts.data) {
      counts.set(row.agent_id, (counts.get(row.agent_id) ?? 0) + 1);
    }
    if (counts.size > 1) {
      agentActivityGini24h = computeGini([...counts.values()]);
    }
  }

  // Compute credits earned Gini
  let creditsEarnedGini24h: number | null = null;
  if (agentCredits.data && agentCredits.data.length > 0) {
    // We need credit_value from tasks — count submissions per agent as proxy
    const counts = new Map<string, number>();
    for (const row of agentCredits.data) {
      counts.set(row.agent_id, (counts.get(row.agent_id) ?? 0) + 1);
    }
    if (counts.size > 1) {
      creditsEarnedGini24h = computeGini([...counts.values()]);
    }
  }

  // Parse trust scores
  let agentTrustScoreMedian: number | null = null;
  let agentTrustScoreP10: number | null = null;
  if (trustScores.data) {
    const scores = trustScores.data as
      | { median: number | null; p10: number | null }[]
      | { median: number | null; p10: number | null };
    const row = Array.isArray(scores) ? scores[0] : scores;
    if (row) {
      agentTrustScoreMedian = row.median;
      agentTrustScoreP10 = row.p10;
    }
  }

  return {
    signalEngagementCorrelation,
    postMedianSignal24h: (postMedianSignal.data as number | null) ?? null,
    postSignalP90P50Ratio: (postSignalRatio.data as number | null) ?? null,
    downvoteRatio24h: (downvoteRatio.data as number | null) ?? null,
    commentsPerPostMedian24h: (commentsPerPost.data as number | null) ?? null,
    uniqueCommentersPerPostAvg:
      (uniqueCommenters.data as number | null) ?? null,
    replyDepthAvg24h: (replyDepth.data as number | null) ?? null,
    reactionsPerPostAvg24h: (reactionsPerPost.data as number | null) ?? null,
    voteUnanimousRate7d: (voteUnanimous.data as number | null) ?? null,
    agentActivityGini24h,
    agentTrustScoreMedian,
    agentTrustScoreP10,
    creditsEarnedGini24h,
    productTaskCompletionRate7d:
      (taskCompletionRate.data as number | null) ?? null,
    productAvgTaskAgeOpenHours:
      (avgOpenTaskAge.data as number | null) ?? null,
    productBlockedRatio: (blockedRatio.data as number | null) ?? null,
    productsWithActivity24h:
      (productsWithActivity.data as number | null) ?? null,
    productRevenueTotal: (revenueTotal.data as number | null) ?? null,
  };
}
