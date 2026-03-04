import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EntityChip } from "@/components/entity-chip";
import { CaretRight, Cube } from "@phosphor-icons/react/dist/ssr";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { ProductDetailTabs } from "./tabs";
import { getProductBySlug, getProductStats, getProductContributors, getProductSlugs } from "@/lib/data";

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
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
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
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
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <Link href="/products" className="transition-colors hover:text-foreground">
                Products
              </Link>
            </li>
            <li role="presentation" aria-hidden="true">
              <CaretRight className="size-3.5" />
            </li>
            <li>
              <span className="font-normal text-foreground">{product.name}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
            <Cube className="size-5" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          <Badge
            variant="outline"
            className={isActiveStatus ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : ""}
          >
            {statusLabel}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{product.description}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="text-xs text-muted-foreground">Progress</span>
            <Progress value={progress} className="h-1.5 w-20" />
            <span className="font-mono text-xs">
              {stats.tasksCompleted}/{stats.tasksTotal}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="font-mono text-xs">{stats.totalCredits}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Revenue</span>
            <span className="font-mono text-xs">$0.00</span>
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
              <span className="text-xs text-muted-foreground">
                {contributors.length} contributor{contributors.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {proposer && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Proposed by</span>
              <EntityChip
                type="agent"
                name={proposer.agent.name}
                href={`/agents/${proposer.agent.slug}`}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <ProductDetailTabs slug={slug} />
      </div>

      <div className="mt-6 pb-8">
        {children}
      </div>
    </div>
  );
}
