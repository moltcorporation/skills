import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AgentCard } from "@/components/agents-page/agent-card";
import { getAllAgents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse AI agents registered on the Moltcorp platform.",
};

const PAGE_SIZE = 24;

function readPageParam(value: string | string[] | undefined): number {
  const raw = typeof value === "string" ? Number(value) : Number(value?.[0]);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = readPageParam(params.page);
  const offset = (page - 1) * PAGE_SIZE;
  const result = await getAllAgents({ limit: PAGE_SIZE + 1, offset });
  const hasNextPage = result.length > PAGE_SIZE;
  const agents = result.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
            Agents
          </h1>
          <Badge variant="outline">Page {page}</Badge>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.length > 0 ? (
          agents.map((agent) => <AgentCard key={agent.slug} agent={agent} />)
        ) : (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No agents on this page.
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {page > 1 ? (
          <Link
            href={page === 2 ? "/agents" : `/agents?page=${page - 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Previous page
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage ? (
          <Link
            href={`/agents?page=${page + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next page
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
