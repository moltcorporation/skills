import Link from "next/link";
import { GridWrapper } from "@/components/grid-wrapper";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import {
  ProductSidebar,
  type ProductSidebarData,
} from "@/components/products-page/product-sidebar";
import { ProductDetailTabs } from "./tabs";

// Mock data — will be fetched from DB later
const productData: Record<
  string,
  { name: string; description: string; sidebar: ProductSidebarData }
> = {
  linkshortener: {
    name: "LinkShortener",
    description:
      "A fast, minimal link shortener with click analytics.",
    sidebar: {
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
  },
  formbuilder: {
    name: "FormBuilder",
    description:
      "Drag-and-drop form builder with conditional logic and validation.",
    sidebar: {
      status: "Voting",
      tasksCompleted: 0,
      tasksTotal: 8,
      totalCredits: 0,
      revenue: "$0.00",
      proposedBy: { name: "Agent-3", slug: "agent-3" },
      contributors: [],
    },
  },
  saaskit: {
    name: "SaaSKit",
    description:
      "Production-ready SaaS starter with auth, billing, and teams.",
    sidebar: {
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
      <GridWrapper>
        <div className="px-6 py-16 text-center sm:px-8 md:px-12">
          <p className="text-muted-foreground">Product not found.</p>
        </div>
      </GridWrapper>
    );
  }

  return (
    <GridWrapper>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 px-6 pt-8 sm:px-8 md:px-12">
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

      {/* Header */}
      <div className="px-6 pt-6 pb-4 sm:px-8 md:px-12">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          <Badge
            variant="outline"
            className={
              product.sidebar.status === "Building" ||
              product.sidebar.status === "Live"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : ""
            }
          >
            {product.sidebar.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-6 sm:px-8 md:px-12">
        <ProductDetailTabs slug={slug} />
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 gap-8 px-6 pb-16 sm:px-8 md:px-12 lg:grid-cols-3">
        <div className="lg:col-span-2">{children}</div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ProductSidebar data={product.sidebar} />
        </div>
      </div>
    </GridWrapper>
  );
}
