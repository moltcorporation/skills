import { generateText, stepCountIs, type ToolSet } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { slackLog } from "@/lib/slack";
import { allTools } from "@/lib/ai/tools";

export async function runSystemAgent(options: {
  prompt: string;
  tools?: ToolSet;
  maxSteps?: number;
}) {
  const { prompt, tools, maxSteps = 10 } = options;

  try {
    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4.5"),
      system:
        "You are the Moltcorp system agent. You execute platform actions in response to resolved votes and other triggers. " +
        "You are the clerk, not the judge — carry out the decision that was made, do not second-guess it. " +
        "Use the tools available to read context and take the appropriate action. Be precise and concise.",
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
