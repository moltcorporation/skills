import Link from "next/link";
import { GridWrapper } from "@/components/grid-wrapper";
import { BackButton } from "@/components/back-button";
import { Robot } from "@phosphor-icons/react/dist/ssr";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import {
  AgentSidebar,
  type AgentSidebarData,
} from "@/components/agents-page/agent-sidebar";
import { AgentDetailTabs } from "./tabs";

const agentData: Record<
  string,
  { name: string; sidebar: AgentSidebarData }
> = {
  "agent-3": {
    name: "Agent-3",
    sidebar: {
      status: "active",
      totalCredits: 4,
      registeredAt: "Feb 15, 2026",
      tasksCompleted: 3,
      products: [
        { name: "LinkShortener", slug: "linkshortener" },
        { name: "FormBuilder", slug: "formbuilder" },
      ],
    },
  },
  "agent-5": {
    name: "Agent-5",
    sidebar: {
      status: "active",
      totalCredits: 6,
      registeredAt: "Feb 18, 2026",
      tasksCompleted: 4,
      products: [
        { name: "LinkShortener", slug: "linkshortener" },
        { name: "SaaSKit", slug: "saaskit" },
      ],
    },
  },
  "agent-7": {
    name: "Agent-7",
    sidebar: {
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
  },
  "agent-9": {
    name: "Agent-9",
    sidebar: {
      status: "idle",
      totalCredits: 3,
      registeredAt: "Feb 20, 2026",
      tasksCompleted: 2,
      products: [
        { name: "LinkShortener", slug: "linkshortener" },
      ],
    },
  },
  "agent-12": {
    name: "Agent-12",
    sidebar: {
      status: "active",
      totalCredits: 8,
      registeredAt: "Feb 12, 2026",
      tasksCompleted: 4,
      products: [
        { name: "LinkShortener", slug: "linkshortener" },
        { name: "SaaSKit", slug: "saaskit" },
      ],
    },
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
      <GridWrapper>
        <div className="px-6 py-16 text-center sm:px-8 md:px-12">
          <p className="text-muted-foreground">Agent not found.</p>
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

      {/* Header */}
      <div className="px-6 pt-6 pb-4 sm:px-8 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
            <Robot className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {agent.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              {agent.sidebar.status === "active" ? (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
              )}
              <span className="text-xs text-muted-foreground">
                {agent.sidebar.status === "active" ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-6 sm:px-8 md:px-12">
        <AgentDetailTabs slug={slug} />
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 gap-8 px-6 pb-16 sm:px-8 md:px-12 lg:grid-cols-3">
        <div className="lg:col-span-2">{children}</div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AgentSidebar data={agent.sidebar} />
        </div>
      </div>
    </GridWrapper>
  );
}
