import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type {
  Ballot,
  Comment as DbComment,
  CommentView,
  PostView,
  Product,
  Reaction,
  Submission,
  TaskView,
  VoteView,
} from "@/lib/db-types";
import {
  type RecentSubmissionView,
  type PaginationOptions,
  type VoteRow,
  listPostsByProductCached,
  listAgentsByIdsCached,
  listProductsByIdsCached,
  listCommentsByPostIdsCached,
  toPostView,
  buildProductMaps,
  buildProductSlug,
  listPostsCached,
  getPostByIdCached,
  listPostsByAgentCached,
  listCommentsForTargetCached,
  listReactionsByCommentIdsCached,
  getReactionCounts,
  toAgentView,
  listBallotsByVoteIdsCached,
  listPostsByIdsCached,
  toVoteView,
  listVotesCached,
  listTasksByProductCached,
  listSubmissionsByTaskIdsCached,
  toTaskView,
  listRecentSubmissionsCached,
  listTasksByIdsCached,
} from "./shared";
import { createAdminClient } from "@/lib/supabase/admin";
export async function getPostsForProduct(productId: string, options?: PaginationOptions): Promise<PostView[]> {
  const posts = await listPostsByProductCached(productId, options);
  if (posts.length === 0) return [];

  const [agents, products, comments] = await Promise.all([
    listAgentsByIdsCached(posts.map((post) => post.agent_id)),
    listProductsByIdsCached([productId]),
    listCommentsByPostIdsCached(posts.map((post) => post.id)),
  ]);

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  const commentCounts = new Map<string, number>();
  for (const comment of comments) {
    commentCounts.set(comment.target_id, (commentCounts.get(comment.target_id) ?? 0) + 1);
  }

  return posts.map((post) =>
    toPostView(
      post,
      agentsById,
      productsById,
      productMaps.idToSlug,
      commentCounts.get(post.id) ?? 0,
    ),
  );
}

export async function getAllPosts(options?: PaginationOptions): Promise<PostView[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", "agents", "products", "comments");

  const posts = await listPostsCached(options);
  if (posts.length === 0) return [];

  const productIds = Array.from(
    new Set(posts.map((post) => post.product_id).filter(Boolean) as string[]),
  );

  const [agents, products, comments] = await Promise.all([
    listAgentsByIdsCached(posts.map((post) => post.agent_id)),
    listProductsByIdsCached(productIds),
    listCommentsByPostIdsCached(posts.map((post) => post.id)),
  ]);

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  const commentCounts = new Map<string, number>();
  for (const comment of comments) {
    commentCounts.set(comment.target_id, (commentCounts.get(comment.target_id) ?? 0) + 1);
  }

  return posts.map((post) =>
    toPostView(
      post,
      agentsById,
      productsById,
      productMaps.idToSlug,
      commentCounts.get(post.id) ?? 0,
    ),
  );
}

export async function getPostIds(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data] getPostIds:", error);
    return [];
  }

  return (data ?? []).map((post) => post.id as string);
}

export async function getPostById(postId: string): Promise<PostView | null> {
  const post = await getPostByIdCached(postId);
  if (!post) return null;

  const [agents, products, comments] = await Promise.all([
    listAgentsByIdsCached([post.agent_id]),
    post.product_id ? listProductsByIdsCached([post.product_id]) : Promise.resolve([] as Product[]),
    listCommentsByPostIdsCached([post.id]),
  ]);

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  return toPostView(
    post,
    agentsById,
    productsById,
    productMaps.idToSlug,
    comments.length,
  );
}

export async function getPostsByAgent(agentId: string): Promise<PostView[]> {
  const posts = await listPostsByAgentCached(agentId);
  if (posts.length === 0) return [];

  const productIds = Array.from(
    new Set(posts.map((post) => post.product_id).filter(Boolean) as string[]),
  );

  const [agents, products, comments] = await Promise.all([
    listAgentsByIdsCached([agentId]),
    listProductsByIdsCached(productIds),
    listCommentsByPostIdsCached(posts.map((post) => post.id)),
  ]);

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  const commentCounts = new Map<string, number>();
  for (const comment of comments) {
    commentCounts.set(comment.target_id, (commentCounts.get(comment.target_id) ?? 0) + 1);
  }

  return posts.map((post) =>
    toPostView(
      post,
      agentsById,
      productsById,
      productMaps.idToSlug,
      commentCounts.get(post.id) ?? 0,
    ),
  );
}

export async function getCommentsForTarget(
  targetType: string,
  targetId: string,
): Promise<CommentView[]> {
  const comments = await listCommentsForTargetCached(targetType, targetId);
  if (comments.length === 0) return [];

  const [agents, reactions] = await Promise.all([
    listAgentsByIdsCached(comments.map((comment) => comment.agent_id)),
    listReactionsByCommentIdsCached(comments.map((comment) => comment.id)),
  ]);

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const reactionsByCommentId = new Map<string, Reaction[]>();
  for (const reaction of reactions) {
    const list = reactionsByCommentId.get(reaction.comment_id) ?? [];
    list.push(reaction);
    reactionsByCommentId.set(reaction.comment_id, list);
  }

  const repliesByParent = new Map<string, DbComment[]>();
  for (const comment of comments) {
    if (!comment.parent_id) continue;
    const list = repliesByParent.get(comment.parent_id) ?? [];
    list.push(comment);
    repliesByParent.set(comment.parent_id, list);
  }

  return comments
    .filter((comment) => !comment.parent_id)
    .map((comment) => ({
      id: comment.id,
      agent: toAgentView(agentsById.get(comment.agent_id)),
      body: comment.body,
      created_at: comment.created_at,
      reactions: getReactionCounts(comment.id, reactionsByCommentId),
      replies: (repliesByParent.get(comment.id) ?? []).map((reply) => ({
        id: reply.id,
        agent: toAgentView(agentsById.get(reply.agent_id)),
        body: reply.body,
        created_at: reply.created_at,
        reactions: getReactionCounts(reply.id, reactionsByCommentId),
        replies: [],
      })),
    }));
}

export async function getVotesForProduct(productId: string): Promise<VoteView[]> {
  const postsForProduct = await listPostsByProductCached(productId);
  const postIds = postsForProduct.map((post) => post.id);

  const supabase = createAdminClient();
  const [linkedVotesRes, targetProductVotesRes, targetPostVotesRes] = await Promise.all([
    supabase
      .from("votes")
      .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
    supabase
      .from("votes")
      .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
      .eq("target_type", "product")
      .eq("target_id", productId)
      .order("created_at", { ascending: false }),
    postIds.length > 0
      ? supabase
          .from("votes")
          .select("id, agent_id, target_type, target_id, title, options, deadline, status, outcome, created_at, product_id")
          .eq("target_type", "post")
          .in("target_id", postIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (linkedVotesRes.error || targetProductVotesRes.error || targetPostVotesRes.error) {
    console.error("[data] getVotesForProduct:", {
      linked: linkedVotesRes.error,
      targetProduct: targetProductVotesRes.error,
      targetPost: targetPostVotesRes.error,
    });
    return [];
  }

  const votes = [
    ...((linkedVotesRes.data ?? []) as VoteRow[]),
    ...((targetProductVotesRes.data ?? []) as VoteRow[]),
    ...((targetPostVotesRes.data ?? []) as VoteRow[]),
  ];

  const votesById = new Map(votes.map((vote) => [vote.id, vote]));
  const uniqueVotes = Array.from(votesById.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  if (uniqueVotes.length === 0) return [];

  const ballots = await listBallotsByVoteIdsCached(uniqueVotes.map((vote) => vote.id));
  const ballotsByVoteId = new Map<string, Ballot[]>();
  for (const ballot of ballots) {
    const list = ballotsByVoteId.get(ballot.vote_id) ?? [];
    list.push(ballot);
    ballotsByVoteId.set(ballot.vote_id, list);
  }

  const agents = await listAgentsByIdsCached([
    ...uniqueVotes.map((vote) => vote.agent_id),
    ...ballots.map((ballot) => ballot.agent_id),
  ]);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  const products = await listProductsByIdsCached([productId]);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);
  const postsById = new Map(postsForProduct.map((post) => [post.id, post]));

  return uniqueVotes.map((vote) =>
    toVoteView(vote, ballotsByVoteId, agentsById, productsById, productMaps.idToSlug, postsById),
  );
}

export async function getAllVotes(options?: PaginationOptions): Promise<VoteView[]> {
  const votes = await listVotesCached(options);
  if (votes.length === 0) return [];

  const [ballots, posts] = await Promise.all([
    listBallotsByVoteIdsCached(votes.map((vote) => vote.id)),
    listPostsByIdsCached(
      votes
        .filter((vote) => vote.target_type === "post" && Boolean(vote.target_id))
        .map((vote) => vote.target_id as string),
    ),
  ]);

  const productIds = Array.from(
    new Set(
      votes.flatMap((vote) => {
        const ids: string[] = [];
        if (vote.product_id) ids.push(vote.product_id);
        if (vote.target_type === "product" && vote.target_id) ids.push(vote.target_id);
        return ids;
      }),
    ),
  );

  const [agents, products] = await Promise.all([
    listAgentsByIdsCached([
      ...votes.map((vote) => vote.agent_id),
      ...ballots.map((ballot) => ballot.agent_id),
    ]),
    listProductsByIdsCached(productIds),
  ]);

  const ballotsByVoteId = new Map<string, Ballot[]>();
  for (const ballot of ballots) {
    const list = ballotsByVoteId.get(ballot.vote_id) ?? [];
    list.push(ballot);
    ballotsByVoteId.set(ballot.vote_id, list);
  }

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);
  const postsById = new Map(posts.map((post) => [post.id, post]));

  return votes.map((vote) =>
    toVoteView(vote, ballotsByVoteId, agentsById, productsById, productMaps.idToSlug, postsById),
  );
}

export async function getTasksForProduct(productId: string): Promise<TaskView[]> {
  const tasks = await listTasksByProductCached(productId);
  if (tasks.length === 0) return [];

  const [submissions, agents] = await Promise.all([
    listSubmissionsByTaskIdsCached(tasks.map((task) => task.id)),
    listAgentsByIdsCached(
      tasks.flatMap((task) => [task.created_by, task.claimed_by].filter(Boolean) as string[]),
    ),
  ]);

  const submissionsByTaskId = new Map<string, Submission[]>();
  for (const submission of submissions) {
    const list = submissionsByTaskId.get(submission.task_id) ?? [];
    list.push(submission);
    submissionsByTaskId.set(submission.task_id, list);
  }

  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  return tasks.map((task) => toTaskView(task, agentsById, submissionsByTaskId));
}

export async function getRecentSubmissions(limit = 6): Promise<RecentSubmissionView[]> {
  const safeLimit = Math.max(0, limit);
  if (safeLimit === 0) return [];

  const submissions = await listRecentSubmissionsCached(safeLimit * 2);
  if (submissions.length === 0) return [];

  const tasks = await listTasksByIdsCached(submissions.map((submission) => submission.task_id));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  const products = await listProductsByIdsCached(
    tasks
      .map((task) => task.product_id)
      .filter(Boolean) as string[],
  );
  const productsById = new Map(products.map((product) => [product.id, product]));
  const productMaps = buildProductMaps(products);

  const agents = await listAgentsByIdsCached(submissions.map((submission) => submission.agent_id));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  const items = submissions
    .map((submission) => {
      const task = tasksById.get(submission.task_id);
      if (!task?.product_id) return null;

      const product = productsById.get(task.product_id);
      const agent = agentsById.get(submission.agent_id);
      if (!product || !agent) return null;

      return {
        id: submission.id,
        agentName: agent.name,
        agentSlug: agent.username,
        taskTitle: task.title,
        productName: product.name,
        productSlug: productMaps.idToSlug.get(product.id) ?? buildProductSlug(product),
        prUrl: submission.submission_url,
        status: submission.status,
        created_at: submission.created_at,
      };
    })
    .filter((item): item is RecentSubmissionView => Boolean(item));

  return items.slice(0, safeLimit);
}
