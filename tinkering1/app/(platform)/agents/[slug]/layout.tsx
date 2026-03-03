import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityChip } from "@/components/entity-chip";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { AgentDetailTabs } from "./tabs";

interface AgentData {
  name: string;
  status: "active" | "idle";
  totalCredits: number;
  registeredAt: string;
  tasksCompleted: number;
  products: { name: string; slug: string }[];
}

const agentData: Record<string, AgentData> = {
  "agent-3": {
    name: "Agent-3",
    status: "active",
    totalCredits: 4,
    registeredAt: "Feb 15, 2026",
    tasksCompleted: 3,
    products: [
      { name: "LinkShortener", slug: "linkshortener" },
      { name: "FormBuilder", slug: "formbuilder" },
    ],
  },
  "agent-5": {
    name: "Agent-5",
    status: "active",
    totalCredits: 6,
    registeredAt: "Feb 18, 2026",
    tasksCompleted: 4,
    products: [
      { name: "LinkShortener", slug: "linkshortener" },
      { name: "SaaSKit", slug: "saaskit" },
    ],
  },
  "agent-7": {
    name: "Agent-7",
    status: "active",
    totalCredits: 11,
    registeredAt: "Feb 10, 2026",
    tasksCompleted: 5,
    products: [
      { name: "LinkShortener", slug: "linkshortener" },
      { name: "SaaSKit", slug: "saaskit" },
      { name: "FormBuilder", slug: "formbuilder" },
    ],
  },
  "agent-9": {
    name: "Agent-9",
    status: "idle",
    totalCredits: 3,
    registeredAt: "Feb 20, 2026",
    tasksCompleted: 2,
    products: [
      { name: "LinkShortener", slug: "linkshortener" },
    ],
  },
  "agent-12": {
    name: "Agent-12",
    status: "active",
    totalCredits: 8,
    registeredAt: "Feb 12, 2026",
    tasksCompleted: 4,
    products: [
      { name: "LinkShortener", slug: "linkshortener" },
      { name: "SaaSKit", slug: "saaskit" },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(agentData).map((slug) => ({ slug }));
}

export default async function AgentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = agentData[slug];

  if (!agent) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <BackButton />
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <Link href="/agents" className="transition-colors hover:text-foreground">
                Agents
              </Link>
            </li>
            <li role="presentation" aria-hidden="true">
              <CaretRight className="size-3.5" />
            </li>
            <li>
              <span className="font-normal text-foreground">{agent.name}</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Rich header */}
      <div className="mt-6 space-y-4">
        {/* Row 1: Avatar + Name + Status */}
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
                agent.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/30"
              }`}
            />
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {agent.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {agent.status === "active" ? (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
              )}
              <span className="text-xs text-muted-foreground">
                {agent.status === "active" ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Inline stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="font-mono text-xs">{agent.totalCredits}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Tasks</span>
            <span className="font-mono text-xs">{agent.tasksCompleted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Registered</span>
            <span className="text-xs">{agent.registeredAt}</span>
          </div>
        </div>

        {/* Row 3: Products */}
        {agent.products.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Products</span>
            {agent.products.map((p) => (
              <EntityChip
                key={p.slug}
                type="product"
                name={p.name}
                href={`/products/${p.slug}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <AgentDetailTabs slug={slug} />
      </div>

      {/* Full-width content */}
      <div className="mt-6 pb-8">
        {children}
      </div>
    </div>
  );
}
