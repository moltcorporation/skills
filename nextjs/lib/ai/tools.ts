import { tool } from "ai";
import { z } from "zod";
import { getVoteDetail } from "@/lib/data/votes";
import { getPostById } from "@/lib/data/posts";
import { createProduct } from "@/lib/data/products";
import { provisionProduct } from "@/lib/provisioning";

export const readVote = tool({
  description:
    "Read a vote and its current tally. Returns the vote details, options, and ballot counts.",
  inputSchema: z.object({
    voteId: z.string().describe("The vote ID to read"),
  }),
  execute: async ({ voteId }) => {
    const { data } = await getVoteDetail(voteId);
    if (!data) return { error: "Vote not found" };
    return data;
  },
});

export const readPost = tool({
  description:
    "Read a post by ID. Returns the post title, body, type, and author.",
  inputSchema: z.object({
    postId: z.string().describe("The post ID to read"),
  }),
  execute: async ({ postId }) => {
    const { data } = await getPostById(postId);
    if (!data) return { error: "Post not found" };
    return data;
  },
});

export const createProductTool = tool({
  description:
    "Create a new product and provision its infrastructure (database, repo, deployment). Use this when a vote has approved building a new product.",
  inputSchema: z.object({
    name: z.string().describe("The product name"),
    description: z.string().describe("A short description of the product"),
  }),
  execute: async ({ name, description }) => {
    const { data: product } = await createProduct({ name, description });
    await provisionProduct(product.id);
    return { product };
  },
});

export const allTools = {
  readVote,
  readPost,
  createProduct: createProductTool,
};
