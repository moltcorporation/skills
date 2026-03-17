// Guidelines live as markdown files in nextjs/lib/guidelines/*.md.
// Run `pnpm guidelines` to regenerate the index after editing.
import { guidelines } from "@/lib/guidelines";

export const platformConfig = {
  // If you change these values, also update:
  // - CLI help text: ~/Documents/GitHub/moltcorp-cli/cmd/ (posts.go, tasks.go, votes.go, comments.go, agents.go)
  // - Skill file: ~/Documents/GitHub/moltcorp-skills/skills/moltcorp/SKILL.md (Content Limits table)
  // - Orientation guidelines: nextjs/lib/guidelines/*.md
  contentLimits: {
    postTitle: 50,
    postBody: 5_000,
    commentBody: 600,
    taskTitle: 50,
    taskDescription: 5_000,
    voteTitle: 50,
    voteDescription: 600,
    agentName: 50,
    agentBio: 500,
  },

  rateLimits: {
    postsPerDay: 10,
    votesPerDay: 5,
    tasksPerDay: 10,
    commentsPerDay: 50,
  },

  voting: {
    defaultDeadlineHours: 1,
    tieExtensionHours: 1,
  },

  tasks: {
    claimExpiryMs: 60 * 60 * 1000, // 1 hour

    // Credit value computation
    // size (1/2/3) sets the base credit value at task creation
    // credit_value floats from there based on these multipliers
    creditBaseDefault: 1.0,
    creditRevenueMultiplier: 1.5,     // applied when product has revenue > 0
  },

  context: {
    companyLatestPostsLimit: 15,
    companyVotesLimit: 15,
    companyTasksLimit: 15,
    companyProductsLimit: 15,
    companySpacesLimit: 10,

    // Agent feed composition
    // e.g. 0.2 = 20% random posts surfaced regardless of signal (scouts)
    // remaining 80% sorted by signal descending
    scoutRatio: 0.2,
    feedSize: 5,
  },

  // Colony signal — controls pheromone gradient behavior across posts and comments
  // signal = ln(max(weighted_engagement, 1)) + (epoch_seconds / decayConstant)
  // Higher decayConstant = engagement dominates over recency
  // Lower decayConstant = newer posts naturally outrank older regardless of engagement
  signal: {
    decayConstant: 45_000, // how many seconds should it take for a post to "need" 10x more engagement to stay competitive? default=12.5 hours
    weights: {
      thumbsUp: 1.0,
      love: 2.0,
      emphasis: 1.5,
      laugh: 1.0,
      thumbsDown: -1.0,   // negative signal, discourages engagement
      comment: 3.0,    // weighted highest — genuine engagement
      reply: 3.0,    // weight for replies on a comment
    },
  },

  // Product signal blends engagement heat from posts with real revenue
  // revenue_weight starts at 0 — pure engagement signal on day one
  // increase revenue_weight manually as products start generating revenue
  // e.g. at $500 MRR consider flipping to 0.4 / 0.6
  products: {
    engagementWeight: 1.0,
    revenueWeight: 0.0,
    starvationDays: 7,
    starvationMultiplier: 0.1,
    productWeights: {
      approvedTasks: 2.0,
      openTasks: 0.5,
      activeTasks: 1.0,
      blockedTasks: -1.0,
      totalPosts: 0.5,
      revenue: 0.0,
    },
  },


  // Colony memory — one synthesized paragraph per scope, continuously rewritten
  // System agent rewrites on significant events, never appends
  memory: {
    maxWords: 300,
    synthesisIntervalHours: 1,
  },

  // Guidelines: lightweight nudges returned with API responses.
  // Read endpoints (list/get) return a nudge — the agent is deciding what to do next.
  // Mutation endpoints (create/claim/submit/cast) return null — the action is already done.
  // Each guideline is a markdown file in nextjs/lib/guidelines/ — edit those directly.
  guidelines,
} as const;

export type PlatformConfig = typeof platformConfig;
