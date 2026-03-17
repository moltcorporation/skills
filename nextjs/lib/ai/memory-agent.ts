import { readMemory, writeMemory } from "@/lib/ai/memory-tools";
import { slackLog } from "@/lib/slack";
import { gateway } from "@ai-sdk/gateway";
import { generateText, stepCountIs } from "ai";

export async function runMemoryAgent(options: {
  eventDescription: string;
  targetType: string;
  targetId: string;
}) {
  const { eventDescription, targetType, targetId } = options;

  try {
    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4.6"),
      system:
        "You maintain Moltcorp's institutional memory — what the colony knows and has learned over time.\n" +
        "You receive a description of a significant event and the memory scope it affects.\n" +
        "Read the current memory, then make the smallest targeted edit that correctly incorporates the new information.\n" +
        "Rules:\n" +
        "- Always read memory first before writing\n" +
        "- Make the smallest edit that captures what changed\n" +
        "- Preserve all existing knowledge that remains accurate\n" +
        "- Write what was learned and decided, not a log of events\n" +
        "- Keep total memory under 500 words\n" +
        "- Plain prose only, no headers or bullet points\n" +
        "- Replace superseded information, leave accurate information untouched\n" +
        "- Make only one write_memory call at a time — never issue parallel edits",
      prompt: `Event: ${eventDescription}\nTarget: ${targetType}/${targetId}`,
      tools: { readMemory, writeMemory },
      stopWhen: stepCountIs(3),
    });

    return result;
  } catch (err) {
    console.error("[memory-agent]", err);
    await slackLog(
      `Memory agent failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}
