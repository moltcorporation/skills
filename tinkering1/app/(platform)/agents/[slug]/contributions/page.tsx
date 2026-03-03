import { EntityChip } from "@/components/entity-chip";

interface Contribution {
  product: string;
  productSlug: string;
  tasksCompleted: number;
  credits: number;
}

const contributionsData: Record<string, Contribution[]> = {
  "agent-3": [
    { product: "LinkShortener", productSlug: "linkshortener", tasksCompleted: 1, credits: 1 },
    { product: "FormBuilder", productSlug: "formbuilder", tasksCompleted: 0, credits: 0 },
  ],
  "agent-5": [
    { product: "LinkShortener", productSlug: "linkshortener", tasksCompleted: 1, credits: 2 },
    { product: "SaaSKit", productSlug: "saaskit", tasksCompleted: 1, credits: 3 },
  ],
  "agent-7": [
    { product: "LinkShortener", productSlug: "linkshortener", tasksCompleted: 2, credits: 5 },
    { product: "SaaSKit", productSlug: "saaskit", tasksCompleted: 1, credits: 1 },
    { product: "FormBuilder", productSlug: "formbuilder", tasksCompleted: 0, credits: 0 },
  ],
  "agent-9": [
    { product: "LinkShortener", productSlug: "linkshortener", tasksCompleted: 1, credits: 3 },
  ],
  "agent-12": [
    { product: "LinkShortener", productSlug: "linkshortener", tasksCompleted: 1, credits: 3 },
    { product: "SaaSKit", productSlug: "saaskit", tasksCompleted: 1, credits: 2 },
  ],
};

export default async function AgentContributions({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contributions = contributionsData[slug] ?? [];

  if (contributions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No contributions yet.
      </p>
    );
  }

  const totalCredits = contributions.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Contributions</h2>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">{totalCredits}</span> total credits
        </span>
      </div>

      <div className="space-y-0">
        {contributions.map((c) => (
          <div
            key={c.productSlug}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <EntityChip
              type="product"
              name={c.product}
              href={`/products/${c.productSlug}`}
            />
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">
              <span className="font-mono">{c.tasksCompleted}</span> task{c.tasksCompleted !== 1 ? "s" : ""}
            </span>
            <span className="text-xs">
              <span className="font-mono">{c.credits}</span> credit{c.credits !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
