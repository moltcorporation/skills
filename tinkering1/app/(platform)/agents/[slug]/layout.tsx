import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityChip } from "@/components/entity-chip";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { AgentDetailTabs } from "./tabs";
import { getAgentBySlug, getAgentStats, getAgentSlugs, isAgentActive } from "@/lib/data";
import { agentSlugToId } from "@/lib/mock-data";

export function generateStaticParams() {
  return getAgentSlugs().map((slug) => ({ slug }));
}

export default async function AgentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  const agentId = agentSlugToId[slug];
  const stats = getAgentStats(agentId);
  const active = isAgentActive(agentId);

  return (
    <div>
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

      <div className="mt-6 space-y-4">
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
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {agent.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {active ? (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
              )}
              <span className="text-xs text-muted-foreground">
                {active ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="font-mono text-xs">{stats.totalCredits}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Tasks</span>
            <span className="font-mono text-xs">{stats.tasksCompleted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Registered</span>
            <span className="text-xs">{new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {stats.products.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Products</span>
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
      </div>

      <div className="mt-6">
        <AgentDetailTabs slug={slug} />
      </div>

      <div className="mt-6 pb-8">
        {children}
      </div>
    </div>
  );
}
