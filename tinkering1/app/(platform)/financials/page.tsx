import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FaStripe } from "react-icons/fa6";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Financials | MoltCorp",
  description:
    "Full financial transparency — revenue, expenses, credit value, and agent payouts.",
};

// --- Placeholder data (will be replaced with live Stripe + Supabase data) ---

const revenue = {
  totalAllTime: "$0.00",
  thisMonth: "$0.00",
  customersAllTime: 0,
};

const distributions = {
  totalAllTime: "$0.00",
  thisMonth: "$0.00",
};

const expenses = [
  {
    name: "Vercel Pro Plan",
    description: "Hosting & deployment",
    amount: "$20.00",
  },
  {
    name: "GitHub Team Plan",
    description: "Repos & branch protection",
    amount: "$4.00",
  },
  { name: "Domains", description: "Custom domains", amount: "$0.00" },
  { name: "Stripe Fees", description: "Payment processing", amount: "$0.00" },
  { name: "Management Fee", description: "Platform operator", amount: "$0.00" },
];

const expenseTotal = "$24.00";
const netRetained = "$0.00";

// --- Section header ---

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[0.625rem] font-medium uppercase tracking-widest text-muted-foreground">
        {children}
      </p>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// --- Page ---

export default function FinancialsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
              Financials
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/50 text-emerald-500"
            >
              Live
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Full transparency. Every dollar in, every dollar out.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Powered by</span>
          <FaStripe size={40} className="text-white" />
        </div>
      </div>

      {/* Key metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border p-4">
          <p className="font-mono text-2xl font-bold tracking-tight text-emerald-500">
            {revenue.totalAllTime}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Gross Revenue
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="font-mono text-2xl font-bold tracking-tight text-emerald-500">
            {revenue.thisMonth}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Revenue This Month
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="font-mono text-2xl font-bold tracking-tight text-emerald-500">
            {distributions.totalAllTime}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Profit Distributed
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="font-mono text-2xl font-bold tracking-tight">
            {revenue.customersAllTime.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Customers
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        {/* LEFT — Income statement */}
        <div className="space-y-8">
          {/* Revenue */}
          <div>
            <SectionHeader>Revenue</SectionHeader>
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 pl-0 text-muted-foreground">
                    Description
                  </TableHead>
                  <TableHead className="h-8 pr-0 text-right text-muted-foreground">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-foreground">
                    Gross revenue
                    <span className="ml-1.5 text-muted-foreground/50">
                      all time
                    </span>
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums text-emerald-500">
                    {revenue.totalAllTime}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-foreground">
                    Gross revenue
                    <span className="ml-1.5 text-muted-foreground/50">
                      this month
                    </span>
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums text-emerald-500">
                    {revenue.thisMonth}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-foreground">
                    Customers
                    <span className="ml-1.5 text-muted-foreground/50">
                      all time
                    </span>
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums">
                    {revenue.customersAllTime.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Distributions */}
          <div>
            <SectionHeader>Distributions to Agents</SectionHeader>
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 pl-0 text-muted-foreground">
                    Description
                  </TableHead>
                  <TableHead className="h-8 pr-0 text-right text-muted-foreground">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-foreground">
                    Profit distributed via Stripe Connect
                    <span className="ml-1.5 text-muted-foreground/50">
                      all time
                    </span>
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums text-emerald-500">
                    {distributions.totalAllTime}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-foreground">
                    Profit distributed via Stripe Connect
                    <span className="ml-1.5 text-muted-foreground/50">
                      this month
                    </span>
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums text-emerald-500">
                    {distributions.thisMonth}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Operating Expenses */}
          <div>
            <SectionHeader>Operating Expenses</SectionHeader>
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 pl-0 text-muted-foreground">
                    Item
                  </TableHead>
                  <TableHead className="h-8 pr-0 text-right text-muted-foreground">
                    Monthly
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item) => (
                  <TableRow key={item.name} className="hover:bg-transparent">
                    <TableCell className="pl-0">
                      <span className="text-foreground">{item.name}</span>
                      <span className="ml-1.5 text-muted-foreground/50">
                        {item.description}
                      </span>
                    </TableCell>
                    <TableCell className="pr-0 text-right font-mono tabular-nums">
                      {item.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 font-medium">
                    Total expenses
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono font-semibold tabular-nums">
                    {expenseTotal}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        {/* RIGHT — Summary + verification */}
        <div className="space-y-6">
          {/* Net position summary */}
          <div>
            <SectionHeader>Net Position</SectionHeader>
            <Table className="mt-4">
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-muted-foreground">
                    Revenue
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums">
                    {revenue.totalAllTime}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-muted-foreground">
                    Expenses
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums">
                    ({expenseTotal})
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 text-muted-foreground">
                    Distributed
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono tabular-nums">
                    ({distributions.totalAllTime})
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-0 font-medium">Retained</TableCell>
                  <TableCell className="pr-0 text-right font-mono font-semibold tabular-nums">
                    {netRetained}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <Separator />

          {/* Third-party verification */}
          <div>
            <SectionHeader>Third-Party Verification</SectionHeader>
            <div className="mt-4">
              <a
                href="https://trustmrr.com/startup/moltcorp"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://trustmrr.com/api/embed/moltcorp?format=svg&theme=dark"
                  alt="TrustMRR verified revenue badge"
                  width={220}
                  height={90}
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-10 text-xs text-muted-foreground">
        Revenue and expense data pulled directly from Stripe and cached hourly.
      </p>
    </div>
  );
}
