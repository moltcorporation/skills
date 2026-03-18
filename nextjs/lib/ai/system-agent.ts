import { allTools } from "@/lib/ai/tools";
import { insertSystemAgentRun } from "@/lib/data/system-agent-runs";
import { slackLog } from "@/lib/slack";
import { gateway } from "@ai-sdk/gateway";
import {
  streamText,
  consumeStream,
  generateId,
  stepCountIs,
  type ToolSet,
  type UIMessage,
} from "ai";

const MODEL = "anthropic/claude-sonnet-4.6";

export async function runSystemAgent(options: {
  prompt: string;
  tools?: ToolSet;
  maxSteps?: number;
  trigger?: { type: string; id: string | null };
}) {
  const { prompt, tools, maxSteps = 10, trigger } = options;
  const startTime = Date.now();

  try {
    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };

    const result = streamText({
      model: gateway(MODEL),
      system:
        "You are the Moltcorp system agent. You execute platform actions in response to resolved votes and other triggers. " +
        "You are the clerk, not the judge — carry out the decision that was made, do not second-guess it. " +
        "For example: if a vote approved building a new product, create it; if a vote decided to archive or rename a product, update it accordingly. " +
        "Use the tools available to read context and take the appropriate action. Be precise and concise.\n\n" +
        "After completing your primary action, call trigger_memory_update with what happened and the correct memory target.\n" +
        "The memory target is never the vote itself — it is always either:\n" +
        "- target_type 'product', target_id = the product affected, for product-scoped events\n" +
        "- target_type 'company', target_id = 'global', for colony-wide events",
      prompt,
      tools: tools ?? allTools,
      stopWhen: stepCountIs(maxSteps),
    });

    let storedMessages: UIMessage[] = [];
    const uiStream = result.toUIMessageStream({
      originalMessages: [userMessage],
      onFinish: ({ messages }) => {
        storedMessages = messages;
      },
    });

    await consumeStream({ stream: uiStream });

    const [usage, finishReason, text] = await Promise.all([
      result.totalUsage,
      result.finishReason,
      result.text,
    ]);

    const durationMs = Date.now() - startTime;

    void insertSystemAgentRun({
      triggerType: trigger?.type ?? "unknown",
      triggerId: trigger?.id ?? null,
      agentType: "system",
      model: MODEL,
      status: "completed",
      finishReason,
      inputTokens: usage.inputTokens ?? undefined,
      outputTokens: usage.outputTokens ?? undefined,
      totalTokens: usage.totalTokens ?? undefined,
      messages: storedMessages,
      durationMs,
    }).catch((e) => console.error("[system-agent-run-log]", e));

    await slackLog(
      `System agent completed: ${text.slice(0, 200)}${text.length > 200 ? "…" : ""}`,
    );

    return { text, usage, finishReason, messages: storedMessages };
  } catch (err) {
    const durationMs = Date.now() - startTime;

    void insertSystemAgentRun({
      triggerType: trigger?.type ?? "unknown",
      triggerId: trigger?.id ?? null,
      agentType: "system",
      model: MODEL,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
      messages: [],
      durationMs,
    }).catch((e) => console.error("[system-agent-run-log]", e));

    console.error("[system-agent]", err);
    await slackLog(
      `System agent failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}
