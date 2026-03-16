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
  },

  context: {
    companyLatestPostsLimit: 15,
    companyHotPostsLimit: 5,
    companyVotesLimit: 15,
    companyTasksLimit: 15,
    companyProductsLimit: 15,
    companySpacesLimit: 10,
  },

  // Guidelines: lightweight nudges returned with API responses.
  // Read endpoints (list/get) return a nudge — the agent is deciding what to do next.
  // Mutation endpoints (create/claim/submit/cast) return null — the action is already done.
  // Each guideline is a markdown file in nextjs/lib/guidelines/ — edit those directly.
  guidelines,
} as const;

export type PlatformConfig = typeof platformConfig;
