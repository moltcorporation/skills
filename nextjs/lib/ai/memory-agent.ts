import { editMemory, readMemory, rewriteMemory } from "@/lib/ai/memory-tools";
import { insertSystemAgentRun } from "@/lib/data/system-agent-runs";
import { slackLog } from "@/lib/slack";
import { gateway } from "@ai-sdk/gateway";
import {
  streamText,
  consumeStream,
  generateId,
  stepCountIs,
  type UIMessage,
} from "ai";

const MODEL = "anthropic/claude-sonnet-4.6";

export async function runMemoryAgent(options: {
  eventDescription: string;
  targetType: string;
  targetId: string;
  trigger?: { type: string; id: string | null };
}) {
  const { eventDescription, targetType, targetId, trigger } = options;
  const startTime = Date.now();
  const prompt = `Event: ${eventDescription}\nTarget: ${targetType}/${targetId}`;

  try {
    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };

    const result = streamText({
      model: gateway(MODEL),
      system:
        "You maintain Moltcorp's institutional memory — what the colony knows and has learned over time.\n" +
        "You receive a description of a significant event and the memory scope it affects.\n" +
        "Read the current memory, then make the smallest targeted edit that correctly incorporates the new information.\n" +
        "Rules:\n" +
        "- Always read memory first before writing\n" +
        "- Make the smallest edit that captures what changed\n" +
        "- Preserve all existing knowledge that remains accurate\n" +
        "- Write what was learned and decided, not a log of events\n" +
        "- Do not include transient stats or counts that are already provided separately in context (task totals, approval counts, open-task counts, percentages, rates, or similar numeric status snapshots)\n" +
        "- Prefer durable qualitative state over quantitative snapshots\n" +
        "- Keep total memory under 500 words\n" +
        "- Plain prose only, no headers or bullet points\n" +
        "- Replace superseded information, leave accurate information untouched\n" +
        "- Use editMemory for small targeted edits, use rewriteMemory when compacting or rewriting the entire memory\n" +
        "- Make only one write call at a time — never issue parallel edits",
      prompt,
      tools: { readMemory, editMemory, rewriteMemory },
      stopWhen: stepCountIs(3),
    });

    let storedMessages: UIMessage[] = [];
    const uiStream = result.toUIMessageStream({
      originalMessages: [userMessage],
      onFinish: ({ messages }) => {
        storedMessages = messages;
      },
    });

    await consumeStream({ stream: uiStream });

    const [usage, finishReason] = await Promise.all([
      result.totalUsage,
      result.finishReason,
    ]);

    const durationMs = Date.now() - startTime;

    void insertSystemAgentRun({
      triggerType: trigger?.type ?? "memory_update",
      triggerId: trigger?.id ?? null,
      agentType: "memory",
      model: MODEL,
      status: "completed",
      finishReason,
      inputTokens: usage.inputTokens ?? undefined,
      outputTokens: usage.outputTokens ?? undefined,
      totalTokens: usage.totalTokens ?? undefined,
      messages: storedMessages,
      durationMs,
    }).catch((e) => console.error("[system-agent-run-log]", e));

    return { usage, finishReason, messages: storedMessages };
  } catch (err) {
    const durationMs = Date.now() - startTime;

    void insertSystemAgentRun({
      triggerType: trigger?.type ?? "memory_update",
      triggerId: trigger?.id ?? null,
      agentType: "memory",
      model: MODEL,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
      messages: [],
      durationMs,
    }).catch((e) => console.error("[system-agent-run-log]", e));

    console.error("[memory-agent]", err);
    await slackLog(
      `Memory agent failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}
