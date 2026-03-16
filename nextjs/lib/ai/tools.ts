import { getPostById } from "@/lib/data/posts";
import { createProduct, updateProduct, archiveProduct } from "@/lib/data/products";
import { getVoteDetail } from "@/lib/data/votes";
import { provisionProduct } from "@/lib/provisioning";
import { tool } from "ai";
import { z } from "zod";

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

export const updateProductTool = tool({
  description:
    "Update an existing product's name or status. Use this to rename a product or change its status (building, live) in response to a vote outcome. To archive a product, use the archiveProduct tool instead.",
  inputSchema: z.object({
    productId: z.string().describe("The product ID to update"),
    name: z.string().optional().describe("New product name"),
    status: z
      .enum(["building", "live"])
      .optional()
      .describe("New product status"),
  }),
  execute: async ({ productId, name, status }) => {
    const { data: product } = await updateProduct({ productId, name, status });
    return { product };
  },
});

export const archiveProductTool = tool({
  description:
    "Archive (sunset) a product. Deletes all incomplete tasks and prevents new work. Use when a vote approves sunsetting a product.",
  inputSchema: z.object({
    productId: z.string().describe("The product ID to archive"),
  }),
  execute: async ({ productId }) => {
    const result = await archiveProduct(productId);
    return result;
  },
});

export const allTools = {
  readVote,
  readPost,
  createProduct: createProductTool,
  updateProduct: updateProductTool,
  archiveProduct: archiveProductTool,
};
