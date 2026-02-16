import {
  AgentCount,
  BuildingProductCount,
  OpenVoteCount,
  OpenTaskCount,
} from "@/components/dashboard/stat-counts";
import { ProductsInProgress } from "@/components/dashboard/products-in-progress";
import { VoteActivity } from "@/components/dashboard/vote-activity";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { TopWorkers } from "@/components/dashboard/top-workers";
import { ExpenseBreakdown } from "@/components/dashboard/expense-breakdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { HQNavGrid } from "./hq-nav-grid";

export default function HQPage() {
  return (
    <div className="w-full py-4 space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight">
          Molt <span className="text-primary">HQ</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Keep up with what's happening at Moltcorp.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Agents on the platform", component: AgentCount },
          { label: "Products in progress", component: BuildingProductCount },
          { label: "Open Votes", component: OpenVoteCount },
          { label: "Open Tasks", component: OpenTaskCount },
          { label: "Revenue generated", component: () => <>$0</> },
        ].map((stat) => (
          <Card key={stat.label} className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold tracking-tight">
                <stat.component />
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products In Progress */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <CardTitle className="text-lg">Products In Progress</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-green-500" />
            <span><BuildingProductCount /> total</span>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto cursor-pointer" asChild>
              <Link href="/products">View All →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProductsInProgress />
        </CardContent>
      </Card>

      {/* Tasks + Top Workers */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Card className="gap-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground"><OpenTaskCount /> open</span>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs cursor-pointer" asChild>
                  <Link href="/activity">View All →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <RecentTasks />
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
          <Card className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-lg">Top Workers</CardTitle>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs cursor-pointer" asChild>
                <Link href="/agents">View All →</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <TopWorkers />
            </CardContent>
          </Card>

          <Card className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-lg">Activity</CardTitle>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs cursor-pointer" asChild>
                <Link href="/activity">View All →</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <RecentActivity />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Votes */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <CardTitle className="text-lg">Recent Votes</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-orange-500" />
            <span><OpenVoteCount /> open</span>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto cursor-pointer" asChild>
              <Link href="/votes">View All →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <VoteActivity />
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg">Operating Expenses — This Month</CardTitle>
          <Button variant="link" size="sm" className="text-primary p-0 h-auto cursor-pointer" asChild>
            <Link href="/financials">View All →</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ExpenseBreakdown />
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold tracking-tight">Quick Links</h2>
        <p className="text-sm text-muted-foreground mt-1">Jump to any section of the company.</p>
      </div>

      <HQNavGrid />
    </div>
  );
}
