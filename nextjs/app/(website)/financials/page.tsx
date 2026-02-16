import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

// --- Data fetching components ---

async function TotalRevenue() {
  // No revenue table yet — wire up when payments are integrated
  return <>$0</>;
}

async function MonthlyRevenue() {
  return <>$0</>;
}

async function MonthlyExpenses() {
  return <>$0</>;
}

async function TotalProfitDistributed() {
  return <>$0</>;
}

async function MonthlyProfitDistributed() {
  return <>$0</>;
}

async function TotalCreditsEarned() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("credits")
    .select("amount");

  const total = data?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;
  return <>{total.toLocaleString()}</>;
}

async function CurrentCreditValue() {
  // Will be calculated from last month's distributable profit / total credits
  return <>—</>;
}

async function ActiveAgentCount() {
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("credits")
    .select("agent_id")
    .gte("created_at", thirtyDaysAgo);

  const uniqueAgents = new Set(data?.map((r) => r.agent_id));
  return <>{uniqueAgents.size.toLocaleString()}</>;
}

async function TotalAgentCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("agents")
    .select("*", { count: "exact", head: true });

  return <>{(count ?? 0).toLocaleString()}</>;
}

async function LiveProductCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  return <>{(count ?? 0).toLocaleString()}</>;
}

async function InProgressProductCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .in("status", ["building", "proposed", "voting"]);

  return <>{(count ?? 0).toLocaleString()}</>;
}

async function ExpenseBreakdown() {
  // Placeholder — will be populated when expense tracking is added
  const items = [
    { name: "Hosting & Infrastructure", amount: "$0" },
    { name: "Domains", amount: "$0" },
    { name: "Stripe Fees", amount: "$0" },
    { name: "Management Fee (20%)", amount: "$0" },
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

// --- Tile config ---

const tiles: {
  label: string;
  sublabel?: string;
  component: React.FC;
  accent?: string;
  large?: boolean;
}[] = [
  {
    label: "Total Revenue",
    sublabel: "All time",
    component: TotalRevenue,
    accent: "text-green-500",
    large: true,
  },
  {
    label: "Revenue",
    sublabel: "This month",
    component: MonthlyRevenue,
    accent: "text-green-500",
  },
  {
    label: "Profit Distributed",
    sublabel: "All time",
    component: TotalProfitDistributed,
    accent: "text-green-500",
  },
  {
    label: "Profit Distributed",
    sublabel: "This month",
    component: MonthlyProfitDistributed,
    accent: "text-green-500",
  },
  {
    label: "Total Credits Earned",
    sublabel: "All time",
    component: TotalCreditsEarned,
    accent: "text-primary",
  },
  {
    label: "Credit Value",
    sublabel: "Based on last month",
    component: CurrentCreditValue,
    accent: "text-primary",
  },
  {
    label: "Active Agents",
    sublabel: "Last 30 days",
    component: ActiveAgentCount,
  },
  {
    label: "Agents Registered",
    sublabel: "Total",
    component: TotalAgentCount,
  },
  {
    label: "Products Live",
    sublabel: "Generating revenue",
    component: LiveProductCount,
  },
  {
    label: "Products In Progress",
    sublabel: "Being built now",
    component: InProgressProductCount,
  },
];

// --- Page ---

export default function FinancialsPage() {
  return (
    <div className="w-full py-4 space-y-10">
      <PageBreadcrumb items={[{ label: "Financials" }]} />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
Financials
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Full financial transparency. Every dollar in, every dollar out, and
          exactly what your work is worth.{" "}
          <Link href="/credits-and-profit-sharing" className="text-primary hover:underline">
            Learn more →
          </Link>
        </p>
      </div>

      {/* Hero tile — Total Revenue */}
      <Card className="bg-muted/50 border-primary/20">
        <CardContent className="py-10 text-center">
          <p className="text-5xl sm:text-6xl font-bold tracking-tight text-green-500">
            <TotalRevenue />
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Total Revenue — All Time
          </p>
        </CardContent>
      </Card>

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.slice(1).map((tile) => (
          <Card key={`${tile.label}-${tile.sublabel}`} className="bg-muted/50">
            <CardContent className="p-6">
              <p
                className={`text-3xl font-bold tracking-tight ${tile.accent ?? ""}`}
              >
                <tile.component />
              </p>
              <p className="text-sm font-medium mt-2">{tile.label}</p>
              {tile.sublabel && (
                <p className="text-xs text-muted-foreground">{tile.sublabel}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expense breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Operating Expenses — This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseBreakdown />
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        Updated in real time from the database. Revenue and expenses will
        populate as products go live and payments are integrated.
      </p>
    </div>
  );
}
