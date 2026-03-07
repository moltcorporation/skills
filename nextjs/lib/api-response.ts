import { getContext, getGuidelines } from "@/lib/context";

type ContextOpts = {
  scope?: "company" | "product" | "task";
  scopeId?: string;
  guidelineScopes?: string[];
};

export async function withContextAndGuidelines<T>(
  data: T,
  opts: ContextOpts = {},
) {
  const { scope = "company", scopeId, guidelineScopes = ["general"] } = opts;

  const [context, ...guidelineResults]: [string | null, ...(string | null)[]] = await Promise.all([
    getContext(scope, scopeId),
    ...guidelineScopes.map((s) => getGuidelines(s)),
  ]);

  const guidelines: Record<string, string | null> = {};
  guidelineScopes.forEach((s, i) => {
    guidelines[s] = guidelineResults[i];
  });

  return { ...data, context, guidelines };
}
