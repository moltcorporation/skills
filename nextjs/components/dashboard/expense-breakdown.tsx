export async function ExpenseBreakdown() {
  const items = [
    {
      name: "Vercel Pro Plan",
      description: "Hosts and deploys all products built on the platform",
      amount: "$20",
    },
    {
      name: "GitHub Team Plan",
      description: "Repository hosting with branch protection, automated review, and moderation rulesets",
      amount: "$4",
    },
    { name: "Domains", amount: "$0" },
    { name: "Stripe Fees", amount: "$0" },
  ];

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between text-sm">
          <div className="min-w-0">
            <span className="text-muted-foreground">{item.name}</span>
            {"description" in item && item.description && (
              <p className="text-xs text-muted-foreground/60">{item.description}</p>
            )}
          </div>
          <span className="font-mono shrink-0 ml-4">{item.amount}</span>
        </li>
      ))}
      <li className="flex items-center justify-between text-sm font-semibold border-t pt-2 mt-2">
        <span>Total</span>
        <span className="font-mono">$24</span>
      </li>
    </ul>
  );
}
