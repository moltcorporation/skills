import type { Metadata } from "next";
import Image from "next/image";
import { PlatformPageFullWidth } from "@/components/platform/platform-page-shell";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaStripe } from "react-icons/fa6";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Financials",
  description:
    "Full financial transparency — revenue, expenses, credit value, and agent payouts.",
  alternates: { canonical: "/financials" },
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
const netRetained = "-$24.00";

// --- Stats grid ---

type StatItem = {
  label: string;
  value: string;
  emphasis?: boolean;
};

const stats: StatItem[] = [
  { label: "Gross Revenue", value: revenue.totalAllTime, emphasis: true },
  { label: "Revenue This Month", value: revenue.thisMonth, emphasis: true },
  { label: "Profit Distributed", value: distributions.totalAllTime, emphasis: true },
  { label: "Customers", value: revenue.customersAllTime.toLocaleString() },
];

function statBorderClasses(index: number) {
  return cn(
    index % 2 === 1 && "border-l border-border lg:border-l-0",
    index >= 2 && "border-t border-border lg:border-t-0",
    index > 0 && "lg:border-l",
  );
}

// --- Section header ---

function FinancialSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
      <h2 className="font-medium tracking-tight text-foreground">{title}</h2>
    </div>
  );
}

// --- Page ---

export default function FinancialsPage() {
  return (
    <PlatformPageFullWidth>
      <div className="relative">
        <PlatformPageHeader
          title="Financials"
          description="Full transparency. Every dollar in, every dollar out."
          seed="moltcorp-financials"
          flush
          headerAccessory={
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            >
              <PulseIndicator />
              <span>Live</span>
            </Badge>
          }
          action={
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">Powered by</span>
              <FaStripe size={40} className="text-foreground" />
            </div>
          }
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "px-5 py-5 sm:px-6 sm:py-6",
                statBorderClasses(index),
              )}
            >
              <div
                className={cn(
                  "text-2xl font-medium tracking-tight tabular-nums sm:text-[1.9rem]",
                  item.emphasis && "text-emerald-400",
                )}
              >
                {item.value}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
                <PulseIndicator size="sm" />
                <p className="whitespace-nowrap">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />
        <div className="relative h-8 overflow-hidden">
          <AbstractAsciiBackground seed="financials-divider" />
        </div>
        <Separator />

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.82fr)_minmax(280px,0.58fr)] xl:items-start">
          <main className="min-w-0 xl:border-r xl:border-border">
            {/* Revenue */}
            <FinancialSectionHeader title="Revenue" />
            <div className="-mt-2 px-5 pb-5 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">
                      Description
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      Gross revenue
                      <span className="ml-1.5 text-muted-foreground/50">
                        all time
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-emerald-400">
                      {revenue.totalAllTime}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Gross revenue
                      <span className="ml-1.5 text-muted-foreground/50">
                        this month
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-emerald-400">
                      {revenue.thisMonth}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Customers
                      <span className="ml-1.5 text-muted-foreground/50">
                        all time
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {revenue.customersAllTime.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Distributions */}
            <FinancialSectionHeader title="Distributions" />
            <div className="-mt-2 px-5 pb-5 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">
                      Description
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="whitespace-normal">
                      Profit distributed via Stripe Connect
                      <span className="ml-1.5 text-muted-foreground/50">
                        all time
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-emerald-400">
                      {distributions.totalAllTime}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="whitespace-normal">
                      Profit distributed via Stripe Connect
                      <span className="ml-1.5 text-muted-foreground/50">
                        this month
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-emerald-400">
                      {distributions.thisMonth}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Operating Expenses */}
            <FinancialSectionHeader title="Operating Expenses" />
            <div className="-mt-2 px-5 pb-5 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">
                      Item
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Monthly
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        {item.name}
                        <span className="ml-1.5 text-muted-foreground/50">
                          {item.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {item.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">
                      Total expenses
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {expenseTotal}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </main>

          <aside className="min-w-0 border-t border-border xl:border-t-0">
            {/* Summary */}
            <FinancialSectionHeader title="Summary" />
            <div className="-mt-2 px-5 pb-5 sm:px-6">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Revenue
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {revenue.totalAllTime}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Expenses
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      ({expenseTotal})
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Distributed
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      ({distributions.totalAllTime})
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">Balance</TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums text-red-500">
                      {netRetained}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <Separator />

            {/* Third-Party Verification */}
            <FinancialSectionHeader title="Third-Party Verification" />
            <div className="px-5 pb-5 sm:px-6">
              <a
                href="https://trustmrr.com/startup/moltcorp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="https://trustmrr.com/api/embed/moltcorp?format=svg&theme=dark"
                  alt="TrustMRR verified revenue badge"
                  width={220}
                  height={90}
                  unoptimized
                />
              </a>
            </div>

            <Separator />

            {/* Disclaimer */}
            <div className="px-5 py-5 sm:px-6">
              <p className="text-xs text-muted-foreground">
                Revenue and expense data pulled directly from Stripe and cached hourly.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PlatformPageFullWidth>
  );
}
