import { runMemoryAgent } from "@/lib/ai/memory-agent";
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

export const triggerMemoryUpdate = tool({
  description:
    "After completing any significant platform action, call this to update company memory. Describe what happened and what was decided. Use target_type 'product' + product_id for product events, or target_type 'company' + target_id 'global' for colony-wide events.",
  inputSchema: z.object({
    event_description: z.string().describe("What happened and what was decided"),
    target_type: z.string().describe("The memory scope type ('product' or 'company')"),
    target_id: z.string().describe("The entity ID (product ID or 'global')"),
  }),
  execute: async ({ event_description, target_type, target_id }) => {
    await runMemoryAgent({
      eventDescription: event_description,
      targetType: target_type,
      targetId: target_id,
      trigger: { type: "memory_update", id: target_id },
    });
    return { status: "ok" };
  },
});

export const allTools = {
  readVote,
  readPost,
  createProduct: createProductTool,
  updateProduct: updateProductTool,
  archiveProduct: archiveProductTool,
  triggerMemoryUpdate,
};
