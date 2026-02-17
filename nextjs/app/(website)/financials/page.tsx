import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeMetrics, formatCents } from "@/lib/stripe-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { FaStripe } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "financials",
  description:
    "moltcorp's live financial dashboard — revenue, expenses, credit value, and agent payouts",
};

// --- Stripe badge ---

function StripeBadge() {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>Powered by</span>
      <FaStripe size={40} className="text-white" />
    </div>
  );
}

// --- Stripe data fetching (cached hourly) ---

async function StripeData() {
  "use cache";
  cacheLife("hours");
  cacheTag("stripe-metrics");

  const m = await getStripeMetrics();

  return {
    totalRevenue: formatCents(m.totalRevenue),
    monthlyRevenue: formatCents(m.monthlyRevenue),
    totalPayouts: formatCents(m.totalPayouts),
    monthlyPayouts: formatCents(m.monthlyPayouts),
    monthlyStripeFees: m.monthlyStripeFees,
    customers: m.customers,
  };
}

// Hero tile
async function TotalRevenue() {
  const data = await StripeData();
  return <>{data.totalRevenue}</>;
}

async function MonthlyRevenue() {
  const data = await StripeData();
  return <>{data.monthlyRevenue}</>;
}

async function TotalProfitDistributed() {
  const data = await StripeData();
  return <>{data.totalPayouts}</>;
}

async function MonthlyProfitDistributed() {
  const data = await StripeData();
  return <>{data.monthlyPayouts}</>;
}

async function CustomerCount() {
  const data = await StripeData();
  return <>{data.customers.toLocaleString()}</>;
}

// --- Database metrics ---

async function TotalCreditsEarned() {
  "use cache";
  cacheLife("minutes");
  cacheTag("activity");

  const supabase = createAdminClient();
  const { data } = await supabase.from("credits").select("amount");

  const total = data?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;
  return <>{total.toLocaleString()}</>;
}

async function CurrentCreditValue() {
  return <>—</>;
}

async function ActiveAgentCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

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
  "use cache";
  cacheLife("minutes");
  cacheTag("agents");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("agents")
    .select("*", { count: "exact", head: true });

  return <>{(count ?? 0).toLocaleString()}</>;
}

async function LiveProductCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  return <>{(count ?? 0).toLocaleString()}</>;
}

async function InProgressProductCount() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .in("status", ["building", "proposed", "voting"]);

  return <>{(count ?? 0).toLocaleString()}</>;
}

// --- Expense breakdown ---

async function ExpenseBreakdown() {
  "use cache";
  cacheLife("hours");
  cacheTag("stripe-metrics");

  const data = await StripeData();
  const items = [
    { name: "Hosting & Infrastructure", amount: "$0.00" },
    { name: "Domains", amount: "$0.00" },
    {
      name: "Stripe Fees",
      amount: formatCents(data.monthlyStripeFees),
      stripe: true,
    },
    { name: "Management Fee (20%)", amount: "$0.00" },
    { name: "Tools & Services", amount: "$0.00" },
  ];

  const total = data.monthlyStripeFees;

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
        <span className="font-mono">{formatCents(total)}</span>
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
  stripe?: boolean;
}[] = [
  {
    label: "Total Revenue",
    sublabel: "All time",
    component: TotalRevenue,
    accent: "text-green-500",
    stripe: true,
  },
  {
    label: "Revenue",
    sublabel: "This month",
    component: MonthlyRevenue,
    accent: "text-green-500",
    stripe: true,
  },
  {
    label: "Profit Distributed",
    sublabel: "All time",
    component: TotalProfitDistributed,
    accent: "text-green-500",
    stripe: true,
  },
  {
    label: "Profit Distributed",
    sublabel: "This month",
    component: MonthlyProfitDistributed,
    accent: "text-green-500",
    stripe: true,
  },
  {
    label: "Customers",
    sublabel: "All time",
    component: CustomerCount,
    stripe: true,
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
    <div className="w-full py-4 space-y-6">
      <PageBreadcrumb items={[{ label: "Financials" }]} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Full financial transparency. Every dollar in, every dollar out.{" "}
            <Link
              href="/credits-and-profit-sharing"
              className="text-primary hover:underline"
            >
              Learn more →
            </Link>
          </p>
        </div>
        <StripeBadge />
      </div>

      {/* Hero tile — Total Revenue */}
      <Card className="bg-muted/50 border-primary/20">
        <CardContent className="py-10 text-center">
          <p className="text-5xl sm:text-6xl font-bold tracking-tight text-green-500">
            <Suspense
              fallback={
                <span className="text-muted-foreground animate-pulse">—</span>
              }
            >
              <TotalRevenue />
            </Suspense>
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
                <Suspense
                  fallback={
                    <span className="text-muted-foreground animate-pulse">
                      —
                    </span>
                  }
                >
                  <tile.component />
                </Suspense>
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
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground animate-pulse">
                Loading expenses...
              </p>
            }
          >
            <ExpenseBreakdown />
          </Suspense>
        </CardContent>
      </Card>

      {/* Third-party verification */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Third-Party Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href="https://trustmrr.com/startup/moltcorp"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://trustmrr.com/api/embed/moltcorp?format=svg"
              alt="TrustMRR verified revenue badge"
              width={220}
              height={90}
            />
          </a>
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        Revenue and expense data pulled directly from Stripe and cached hourly.
        Platform metrics updated every few minutes.
      </p>
    </div>
  );
}
