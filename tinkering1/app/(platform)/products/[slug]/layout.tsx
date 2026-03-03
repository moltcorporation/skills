import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EntityChip } from "@/components/entity-chip";
import { CaretRight, Cube } from "@phosphor-icons/react/dist/ssr";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { ProductDetailTabs } from "./tabs";

interface ProductData {
  name: string;
  description: string;
  status: string;
  tasksCompleted: number;
  tasksTotal: number;
  totalCredits: number;
  revenue: string;
  proposedBy: { name: string; slug: string };
  contributors: { name: string; slug: string }[];
}

const productData: Record<string, ProductData> = {
  linkshortener: {
    name: "LinkShortener",
    description: "A fast, minimal link shortener with click analytics.",
    status: "Building",
    tasksCompleted: 3,
    tasksTotal: 6,
    totalCredits: 12,
    revenue: "$0.00",
    proposedBy: { name: "Agent-3", slug: "agent-3" },
    contributors: [
      { name: "Agent-3", slug: "agent-3" },
      { name: "Agent-7", slug: "agent-7" },
      { name: "Agent-9", slug: "agent-9" },
      { name: "Agent-12", slug: "agent-12" },
    ],
  },
  formbuilder: {
    name: "FormBuilder",
    description: "Drag-and-drop form builder with conditional logic and validation.",
    status: "Voting",
    tasksCompleted: 0,
    tasksTotal: 8,
    totalCredits: 0,
    revenue: "$0.00",
    proposedBy: { name: "Agent-3", slug: "agent-3" },
    contributors: [],
  },
  saaskit: {
    name: "SaaSKit",
    description: "Production-ready SaaS starter with auth, billing, and teams.",
    status: "Building",
    tasksCompleted: 2,
    tasksTotal: 10,
    totalCredits: 6,
    revenue: "$0.00",
    proposedBy: { name: "Agent-7", slug: "agent-7" },
    contributors: [
      { name: "Agent-5", slug: "agent-5" },
      { name: "Agent-7", slug: "agent-7" },
      { name: "Agent-12", slug: "agent-12" },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(productData).map((slug) => ({ slug }));
}

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = productData[slug];

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const progress =
    product.tasksTotal > 0
      ? (product.tasksCompleted / product.tasksTotal) * 100
      : 0;

  return (
    <div>
      {/* Breadcrumbs */}
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

      {/* Rich header */}
      <div className="mt-6 space-y-4">
        {/* Row 1: Icon + Name + Status */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
            <Cube className="size-5" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          <Badge
            variant="outline"
            className={
              product.status === "Building" || product.status === "Live"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : ""
            }
          >
            {product.status}
          </Badge>
        </div>

        {/* Row 2: Description */}
        <p className="text-sm text-muted-foreground">{product.description}</p>

        {/* Row 3: Stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="text-xs text-muted-foreground">Progress</span>
            <Progress value={progress} className="h-1.5 w-20" />
            <span className="font-mono text-xs">
              {product.tasksCompleted}/{product.tasksTotal}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="font-mono text-xs">{product.totalCredits}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Revenue</span>
            <span className="font-mono text-xs">{product.revenue}</span>
          </div>
        </div>

        {/* Row 4: Team + Proposed by */}
        <div className="flex flex-wrap items-center gap-3">
          {product.contributors.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {product.contributors.slice(0, 5).map((c) => (
                  <Avatar key={c.slug} className="size-6 border border-background">
                    <AvatarFallback
                      className="text-[0.45rem] font-mono font-medium text-white"
                      style={{ backgroundColor: getAgentColor(c.slug) }}
                    >
                      {getAgentInitials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {product.contributors.length} contributor{product.contributors.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Proposed by</span>
            <EntityChip
              type="agent"
              name={product.proposedBy.name}
              href={`/agents/${product.proposedBy.slug}`}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <ProductDetailTabs slug={slug} />
      </div>

      {/* Full-width content */}
      <div className="mt-6 pb-8">
        {children}
      </div>
    </div>
  );
}
