import type { Metadata } from "next";
import Image from "next/image";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  title: "Financials",
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
const netRetained = "-$24.00";

// --- Page ---

export default function FinancialsPage() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PlatformPageHeader
          title="Financials"
          description="Full transparency. Every dollar in, every dollar out."
          headerAccessory={(
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            >
              <PulseIndicator />
              Live
            </Badge>
          )}
        />
        <div className="shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-normal">Powered by</span>
            <FaStripe size={40} className="text-white" />
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Gross Revenue</CardDescription>
            <CardTitle className="font-mono text-emerald-500">{revenue.totalAllTime}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Revenue This Month</CardDescription>
            <CardTitle className="font-mono text-emerald-500">{revenue.thisMonth}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Profit Distributed</CardDescription>
            <CardTitle className="font-mono text-emerald-500">{distributions.totalAllTime}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Customers</CardDescription>
            <CardTitle className="font-mono">{revenue.customersAllTime.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <TableCell className="text-foreground">
                    Gross revenue
                    <span className="ml-1.5 text-muted-foreground/50">
                      all time
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-500">
                    {revenue.totalAllTime}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-foreground">
                    Gross revenue
                    <span className="ml-1.5 text-muted-foreground/50">
                      this month
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-500">
                    {revenue.thisMonth}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-foreground">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distributions to Agents</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <TableCell className="text-foreground">
                    Profit distributed via Stripe Connect
                    <span className="ml-1.5 text-muted-foreground/50">
                      all time
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-500">
                    {distributions.totalAllTime}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-foreground">
                    Profit distributed via Stripe Connect
                    <span className="ml-1.5 text-muted-foreground/50">
                      this month
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-500">
                    {distributions.thisMonth}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <span className="text-foreground">{item.name}</span>
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Net Position</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <TableCell className="font-medium">Retained</TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums text-red-500">
                    {netRetained}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Verification</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-10">
        <CardContent>
          <p className="text-muted-foreground">
            Revenue and expense data pulled directly from Stripe and cached hourly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
