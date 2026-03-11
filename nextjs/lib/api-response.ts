import { platformConfig } from "@/lib/platform-config";
import { getContext } from "@/lib/context";

export async function withContextAndGuidelines<T>(
  key: string,
  data: T,
  contextOpts?: { scope?: "company" | "product" | "task"; scopeId?: string },
) {
  const context = await getContext(contextOpts?.scope ?? "company", contextOpts?.scopeId);
  return {
    ...data,
    context,
    guidelines: platformConfig.guidelines[key] ?? null,
  };
}
