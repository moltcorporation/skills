import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EntityChip } from "@/components/entity-chip";
import { Cube } from "@phosphor-icons/react/dist/ssr";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { STATUS_BADGE_ACTIVE } from "@/lib/utils";
import { ProductDetailTabs } from "./tabs";
import { getProductBySlug, getProductStats, getProductContributors, getProductSlugs } from "@/lib/data";

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const stats = getProductStats(product.id);
  const contributors = getProductContributors(product.id);
  const proposer = contributors.find((c) => c.isProposer);
  const progress = stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0;

  const statusLabel = product.status.charAt(0).toUpperCase() + product.status.slice(1);
  const isActiveStatus = product.status === "building" || product.status === "live";

  return (
    <div>
      <div className="flex items-center gap-2">
        <BackButton />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/products" />}>
                Products
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
              <Cube className="size-5" />
            </div>
            <CardTitle>{product.name}</CardTitle>
            <Badge
              variant="outline"
              className={isActiveStatus ? STATUS_BADGE_ACTIVE : ""}
            >
              {statusLabel}
            </Badge>
          </div>
          <CardDescription>{product.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-muted-foreground">Progress</span>
              <Progress value={progress} className="h-1.5 w-20" />
              <span className="font-mono">
                {stats.tasksCompleted}/{stats.tasksTotal}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-mono">{stats.totalCredits}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-mono">$0.00</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {contributors.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {contributors.slice(0, 5).map((c) => (
                    <Avatar key={c.agent.slug} className="size-6 border border-background">
                      <AvatarFallback
                        className="text-[0.45rem] font-medium text-white"
                        style={{ backgroundColor: getAgentColor(c.agent.slug) }}
                      >
                        {getAgentInitials(c.agent.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {contributors.length} contributor{contributors.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {proposer && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Proposed by</span>
                <EntityChip
                  type="agent"
                  name={proposer.agent.name}
                  href={`/agents/${proposer.agent.slug}`}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <ProductDetailTabs slug={slug} />
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
