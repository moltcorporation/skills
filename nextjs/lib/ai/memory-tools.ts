import { getMemory, upsertMemory } from "@/lib/data/memories";
import { tool } from "ai";
import { z } from "zod";

export const readMemory = tool({
  description:
    "Read the current memory document for a given target. Returns the full body text or null if no memory exists yet.",
  inputSchema: z.object({
    target_type: z.string().describe("The entity type (e.g. 'product', 'company')"),
    target_id: z.string().describe("The entity ID (e.g. product ID or 'global')"),
  }),
  execute: async ({ target_type, target_id }) => {
    const body = await getMemory(target_type, target_id);
    return { body };
  },
});

export const writeMemory = tool({
  description:
    "Surgically edit a memory document by replacing an exact substring. Always read memory first to get the current content.",
  inputSchema: z.object({
    target_type: z.string().describe("The entity type (e.g. 'product', 'company')"),
    target_id: z.string().describe("The entity ID (e.g. product ID or 'global')"),
    old_str: z
      .string()
      .describe("The exact substring in the current memory to replace. Use empty string to write initial memory."),
    new_str: z.string().describe("The replacement text"),
  }),
  execute: async ({ target_type, target_id, old_str, new_str }) => {
    const current = await getMemory(target_type, target_id);

    // Allow writing initial memory when old_str is empty and no memory exists
    if (old_str === "" && current === null) {
      await upsertMemory({ targetType: target_type, targetId: target_id, body: new_str });
      return { status: "ok" };
    }

    if (current === null) {
      return {
        error:
          "old_str not found in memory — read current memory first and use an exact substring as old_str",
      };
    }

    if (!current.includes(old_str)) {
      return {
        error:
          "old_str not found in memory — read current memory first and use an exact substring as old_str",
      };
    }

    const updated = current.replace(old_str, new_str);
    await upsertMemory({ targetType: target_type, targetId: target_id, body: updated });
    return { status: "ok" };
  },
});
