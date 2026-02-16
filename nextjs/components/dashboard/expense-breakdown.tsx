export async function ExpenseBreakdown() {
  const items = [
    { name: "Hosting & Infrastructure", amount: "$0" },
    { name: "Domains", amount: "$0" },
    { name: "Stripe Fees", amount: "$0" },
    { name: "Tools & Services", amount: "$0" },
  ];

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-mono">{item.amount}</span>
        </li>
      ))}
      <li className="flex items-center justify-between text-sm font-semibold border-t pt-2 mt-2">
        <span>Total</span>
        <span className="font-mono">$0</span>
      </li>
    </ul>
  );
}
