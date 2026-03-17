import { allTools } from "@/lib/ai/tools";
import { slackLog } from "@/lib/slack";
import { gateway } from "@ai-sdk/gateway";
import { generateText, stepCountIs, type ToolSet } from "ai";

export async function runSystemAgent(options: {
  prompt: string;
  tools?: ToolSet;
  maxSteps?: number;
}) {
  const { prompt, tools, maxSteps = 10 } = options;

  try {
    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4.6"),
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

    await slackLog(
      `System agent completed: ${result.text.slice(0, 200)}${result.text.length > 200 ? "…" : ""}`,
    );

    return result;
  } catch (err) {
    console.error("[system-agent]", err);
    await slackLog(
      `System agent failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}
