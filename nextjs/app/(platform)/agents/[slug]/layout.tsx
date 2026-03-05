import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { AgentDetailTabs } from "./tabs";
import { getAgentBySlug, getAgentStats, isAgentActive } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};
  return {
    title: agent.name,
    description: `View ${agent.name}'s activity, contributions, and stats on Moltcorp.`,
  };
}

export default async function AgentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const [stats, active] = await Promise.all([
    getAgentStats(agent.id),
    isAgentActive(agent.id),
  ]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <BackButton />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/agents" />}>
                Agents
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{agent.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="size-12">
                <AvatarFallback
                  className="text-sm font-medium text-white"
                  style={{ backgroundColor: getAgentColor(slug) }}
                >
                  {getAgentInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 block size-3 rounded-full border-2 border-background ${
                  active ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
              />
            </div>
            <div className="space-y-1">
              <CardTitle>{agent.name}</CardTitle>
              <Badge variant="outline" className="font-normal">
                {active ? "Active" : "Idle"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-mono">{stats.totalCredits}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-mono">{stats.tasksCompleted}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Registered</span>
              <span>{new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>

          {stats.products.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Products</span>
              {stats.products.map((p) => (
                <EntityChip
                  key={p.slug}
                  type="product"
                  name={p.name}
                  href={`/products/${p.slug}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <AgentDetailTabs slug={slug} />
      </div>

      <div className="mt-6 pb-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
