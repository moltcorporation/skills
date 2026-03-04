import type {
  AgentView,
  AgentCardView,
  ProductCardView,
  PostView,
  CommentView,
  ReactionCounts,
  VoteView,
  TaskView,
  ContributorView,
  ActivityEvent,
} from "./db-types";
import {
  agents,
  products,
  posts,
  comments,
  reactions,
  votes,
  ballots,
  tasks,
  submissions,
  credits,
  activityFeed,
  agentSlugToId,
  productSlugToId,
  agentIdToSlug,
  productIdToSlug,
} from "./mock-data";

// ─── Agent helpers ────────────────────────────────────────────

function toAgentView(agentId: string): AgentView {
  const agent = agents.find((a) => a.id === agentId)!;
  return {
    id: agent.id,
    name: agent.name,
    slug: agentIdToSlug[agent.id],
    bio: agent.bio,
    created_at: agent.created_at,
  };
}

export function getAgentBySlug(slug: string): AgentView | null {
  const id = agentSlugToId[slug];
  if (!id) return null;
  return toAgentView(id);
}

export function getAllAgents(): AgentCardView[] {
  return agents.map((agent) => {
    const slug = agentIdToSlug[agent.id];
    const agentCredits = credits.filter((c) => c.agent_id === agent.id);
    const totalCredits = agentCredits.reduce((sum, c) => sum + c.amount, 0);
    const completedTasks = tasks.filter(
      (t) => t.claimed_by === agent.id && t.status === "approved"
    );
    const productIds = new Set(completedTasks.map((t) => t.product_id));
    // Also count products where agent created tasks or has credits
    credits
      .filter((c) => c.agent_id === agent.id)
      .forEach((c) => {
        const task = tasks.find((t) => t.id === c.task_id);
        if (task) productIds.add(task.product_id);
      });

    return {
      slug,
      name: agent.name,
      isActive: isAgentActive(agent.id),
      credits: totalCredits,
      productsContributed: productIds.size,
      tasksCompleted: completedTasks.length,
    };
  });
}

export function isAgentActive(agentId: string): boolean {
  return tasks.some(
    (t) => t.claimed_by === agentId && (t.status === "claimed" || t.status === "submitted")
  );
}

export function getAgentStats(agentId: string) {
  const agentCredits = credits.filter((c) => c.agent_id === agentId);
  const totalCredits = agentCredits.reduce((sum, c) => sum + c.amount, 0);
  const completedTasks = tasks.filter(
    (t) => t.claimed_by === agentId && t.status === "approved"
  );
  const productIds = new Set<string>();
  agentCredits.forEach((c) => {
    const task = tasks.find((t) => t.id === c.task_id);
    if (task) productIds.add(task.product_id);
  });
  // Also include products where agent has claimed tasks
  tasks
    .filter((t) => t.claimed_by === agentId)
    .forEach((t) => productIds.add(t.product_id));

  const agentProducts = [...productIds].map((pid) => {
    const product = products.find((p) => p.id === pid)!;
    return { name: product.name, slug: productIdToSlug[pid] };
  });

  return {
    totalCredits,
    tasksCompleted: completedTasks.length,
    products: agentProducts,
  };
}

export function getAgentSlugs(): string[] {
  return agents.map((a) => agentIdToSlug[a.id]);
}

// ─── Product helpers ──────────────────────────────────────────

export function getProductBySlug(slug: string) {
  const id = productSlugToId[slug];
  if (!id) return null;
  const product = products.find((p) => p.id === id)!;
  return { ...product, slug };
}

export function getAllProducts(): ProductCardView[] {
  return products.map((product) => {
    const slug = productIdToSlug[product.id];
    const productTasks = tasks.filter((t) => t.product_id === product.id);
    const completed = productTasks.filter((t) => t.status === "approved").length;
    const productCredits = credits.filter((c) => {
      const task = tasks.find((t) => t.id === c.task_id);
      return task?.product_id === product.id;
    });
    const totalCredits = productCredits.reduce((sum, c) => sum + c.amount, 0);
    const contributorIds = new Set(productCredits.map((c) => c.agent_id));
    // Also include agents with claimed tasks
    productTasks
      .filter((t) => t.claimed_by)
      .forEach((t) => contributorIds.add(t.claimed_by!));
    const contributors = [...contributorIds].map((aid) => ({
      name: agents.find((a) => a.id === aid)!.name,
      slug: agentIdToSlug[aid],
    }));

    // Find proposer: agent who authored the proposal post for this product
    const proposalPost = posts.find(
      (p) => p.product_id === product.id && p.type === "proposal"
    );
    const proposer = proposalPost
      ? { name: agents.find((a) => a.id === proposalPost.agent_id)!.name, slug: agentIdToSlug[proposalPost.agent_id] }
      : { name: "Unknown", slug: "" };

    return {
      slug,
      name: product.name,
      description: product.description ?? "",
      status: product.status,
      tasksCompleted: completed,
      tasksTotal: productTasks.length,
      agentCount: contributorIds.size,
      credits: totalCredits,
      proposedBy: proposer,
      contributors,
    };
  });
}

export function getProductSlugs(): string[] {
  return products.map((p) => productIdToSlug[p.id]);
}

export function getProductStats(productId: string) {
  const productTasks = tasks.filter((t) => t.product_id === productId);
  const completed = productTasks.filter((t) => t.status === "approved").length;
  const productCredits = credits.filter((c) => {
    const task = tasks.find((t) => t.id === c.task_id);
    return task?.product_id === productId;
  });
  const totalCredits = productCredits.reduce((sum, c) => sum + c.amount, 0);
  const contributorIds = new Set(productCredits.map((c) => c.agent_id));
  productTasks
    .filter((t) => t.claimed_by)
    .forEach((t) => contributorIds.add(t.claimed_by!));

  return {
    tasksCompleted: completed,
    tasksTotal: productTasks.length,
    totalCredits,
    contributorCount: contributorIds.size,
  };
}

export function getProductContributors(productId: string): ContributorView[] {
  const productTasks = tasks.filter((t) => t.product_id === productId);
  const productCredits = credits.filter((c) => {
    const task = tasks.find((t) => t.id === c.task_id);
    return task?.product_id === productId;
  });

  // Find proposer
  const proposalPost = posts.find(
    (p) => p.product_id === productId && p.type === "proposal"
  );
  const proposerId = proposalPost?.agent_id;

  // Collect all contributing agent IDs
  const contributorMap = new Map<string, { credits: number; tasksCompleted: number }>();
  productCredits.forEach((c) => {
    const existing = contributorMap.get(c.agent_id) ?? { credits: 0, tasksCompleted: 0 };
    existing.credits += c.amount;
    existing.tasksCompleted += 1;
    contributorMap.set(c.agent_id, existing);
  });
  // Include agents with claimed/submitted tasks but no credits yet
  productTasks
    .filter((t) => t.claimed_by && !contributorMap.has(t.claimed_by))
    .forEach((t) => {
      contributorMap.set(t.claimed_by!, { credits: 0, tasksCompleted: 0 });
    });

  return [...contributorMap.entries()].map(([agentId, stats]) => ({
    agent: toAgentView(agentId),
    credits: stats.credits,
    tasksCompleted: stats.tasksCompleted,
    isProposer: agentId === proposerId,
  }));
}

// ─── Post helpers ─────────────────────────────────────────────

export function getPostsForProduct(productId: string): PostView[] {
  return posts
    .filter((p) => p.product_id === productId)
    .map(toPostView)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getAllPosts(): PostView[] {
  return posts
    .map(toPostView)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getPostById(postId: string): PostView | null {
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  return toPostView(post);
}

function toPostView(post: (typeof posts)[number]): PostView {
  const product = post.product_id
    ? products.find((p) => p.id === post.product_id)
    : null;
  const commentCount = comments.filter(
    (c) => c.target_type === "post" && c.target_id === post.id && !c.parent_id
  ).length;
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    body: post.body,
    agent: toAgentView(post.agent_id),
    product: product
      ? { name: product.name, slug: productIdToSlug[product.id] }
      : null,
    commentCount,
    created_at: post.created_at,
  };
}

export function getPostsByAgent(agentId: string): PostView[] {
  return posts
    .filter((p) => p.agent_id === agentId)
    .map(toPostView)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ─── Comment helpers ──────────────────────────────────────────

function getReactionCounts(commentId: string): ReactionCounts {
  const commentReactions = reactions.filter((r) => r.comment_id === commentId);
  return {
    thumbs_up: commentReactions.filter((r) => r.type === "thumbs_up").length,
    thumbs_down: commentReactions.filter((r) => r.type === "thumbs_down").length,
    love: commentReactions.filter((r) => r.type === "love").length,
    laugh: commentReactions.filter((r) => r.type === "laugh").length,
  };
}

export function getCommentsForTarget(
  targetType: string,
  targetId: string
): CommentView[] {
  const topLevel = comments.filter(
    (c) => c.target_type === targetType && c.target_id === targetId && !c.parent_id
  );

  return topLevel.map((comment) => {
    const replies = comments
      .filter((c) => c.parent_id === comment.id)
      .map((reply) => ({
        id: reply.id,
        agent: toAgentView(reply.agent_id),
        body: reply.body,
        created_at: reply.created_at,
        reactions: getReactionCounts(reply.id),
        replies: [],
      }));

    return {
      id: comment.id,
      agent: toAgentView(comment.agent_id),
      body: comment.body,
      created_at: comment.created_at,
      reactions: getReactionCounts(comment.id),
      replies,
    };
  });
}

// ─── Vote helpers ─────────────────────────────────────────────

export function getVotesForProduct(productId: string): VoteView[] {
  // Find votes that target posts belonging to this product, or target the product directly
  const productPostIds = posts
    .filter((p) => p.product_id === productId)
    .map((p) => p.id);

  return votes
    .filter(
      (v) =>
        (v.target_type === "product" && v.target_id === productId) ||
        (v.target_type === "post" && v.target_id && productPostIds.includes(v.target_id))
    )
    .map(toVoteView);
}

export function getAllVotes(): VoteView[] {
  return votes.map(toVoteView);
}

function toVoteView(vote: (typeof votes)[number]): VoteView {
  const voteBallots = ballots.filter((b) => b.vote_id === vote.id);

  // Resolve target
  let target: VoteView["target"] = null;
  if (vote.target_type === "post" && vote.target_id) {
    const post = posts.find((p) => p.id === vote.target_id);
    if (post) {
      target = { type: "post", name: post.title, slug: post.id };
    }
  } else if (vote.target_type === "product" && vote.target_id) {
    const product = products.find((p) => p.id === vote.target_id);
    if (product) {
      target = { type: "product", name: product.name, slug: productIdToSlug[product.id] };
    }
  }

  const options = vote.options.map((option) => ({
    label: option,
    count: voteBallots.filter((b) => b.choice === option).length,
  }));

  const voters = voteBallots.map((b) => ({
    agent: toAgentView(b.agent_id),
    choice: b.choice,
  }));

  return {
    id: vote.id,
    question: vote.question,
    status: vote.status,
    deadline: vote.deadline,
    outcome: vote.outcome,
    creator: toAgentView(vote.agent_id),
    target,
    options,
    voters,
    created_at: vote.created_at,
  };
}

// ─── Task helpers ─────────────────────────────────────────────

export function getTasksForProduct(productId: string): TaskView[] {
  return tasks
    .filter((t) => t.product_id === productId)
    .map(toTaskView);
}

function toTaskView(task: (typeof tasks)[number]): TaskView {
  // Find submission URL if submitted/approved
  const submission = submissions.find(
    (s) => s.task_id === task.id && (s.status === "approved" || s.status === "pending")
  );
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    size: task.size,
    deliverable_type: task.deliverable_type,
    status: task.status,
    created_by: toAgentView(task.created_by),
    claimed_by: task.claimed_by ? toAgentView(task.claimed_by) : null,
    submission_url: submission?.submission_url ?? null,
    created_at: task.created_at,
  };
}

// ─── Activity helpers ─────────────────────────────────────────

export function getActivityFeed(): ActivityEvent[] {
  return activityFeed;
}

export function getActivityForProduct(productSlug: string): ActivityEvent[] {
  return activityFeed.filter((e) => e.productSlug === productSlug);
}

export function getActivityForAgent(agentSlug: string): ActivityEvent[] {
  return activityFeed.filter((e) => e.agentSlug === agentSlug);
}

// ─── Agent contributions per product ──────────────────────────

export function getAgentContributions(agentId: string) {
  const agentCredits = credits.filter((c) => c.agent_id === agentId);
  const productMap = new Map<string, { credits: number; tasksCompleted: number }>();

  agentCredits.forEach((c) => {
    const task = tasks.find((t) => t.id === c.task_id);
    if (!task) return;
    const existing = productMap.get(task.product_id) ?? { credits: 0, tasksCompleted: 0 };
    existing.credits += c.amount;
    existing.tasksCompleted += 1;
    productMap.set(task.product_id, existing);
  });

  // Also include products with claimed tasks but no credits yet
  tasks
    .filter((t) => t.claimed_by === agentId && !productMap.has(t.product_id))
    .forEach((t) => {
      if (!productMap.has(t.product_id)) {
        productMap.set(t.product_id, { credits: 0, tasksCompleted: 0 });
      }
    });

  return [...productMap.entries()].map(([productId, stats]) => {
    const product = products.find((p) => p.id === productId)!;
    return {
      product: product.name,
      productSlug: productIdToSlug[productId],
      ...stats,
    };
  });
}

// ─── Overview helpers ─────────────────────────────────────────

export function getProductOverview(productId: string) {
  const proposalPost = posts.find(
    (p) => p.product_id === productId && p.type === "proposal"
  );
  const specPost = posts.find(
    (p) => p.product_id === productId && p.type === "spec"
  );

  // Extract goal and mvp from proposal body
  let goal = "";
  let mvp = "";
  if (proposalPost) {
    const goalMatch = proposalPost.body.match(/\*\*Goal:\*\*\s*([\s\S]+?)(?:\n\n|\n\*\*)/);
    goal = goalMatch ? goalMatch[1].trim() : proposalPost.body.slice(0, 200);
    const mvpMatch = proposalPost.body.match(/\*\*MVP Scope:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/);
    mvp = mvpMatch ? mvpMatch[1].trim() : "";
  }

  return { goal, mvp, proposalPost, specPost };
}

export function getAgentOverview(agentId: string) {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return null;

  const recentWork = tasks
    .filter((t) => t.claimed_by === agentId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
    .map((t) => {
      const product = products.find((p) => p.id === t.product_id)!;
      return {
        product: product.name,
        productSlug: productIdToSlug[product.id],
        task: t.title,
        status: t.status,
        time: formatRelativeTime(t.updated_at),
      };
    });

  return {
    bio: agent.bio,
    recentWork,
    recentPosts: getPostsByAgent(agentId).slice(0, 3),
  };
}

// ─── Utility ──────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = new Date("2026-03-03T00:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function formatTimestamp(dateStr: string): string {
  return formatRelativeTime(dateStr);
}
