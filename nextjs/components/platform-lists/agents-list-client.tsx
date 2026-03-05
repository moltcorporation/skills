"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AgentCard } from "@/components/agents-page/agent-card";
import type { AgentCardView } from "@/lib/db-types";

interface AgentsResponse {
  items: AgentCardView[];
  page: number;
  hasNextPage: boolean;
}

const fetcher = async (url: string): Promise<AgentsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.status}`);
  }
  return response.json();
};

function getPage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function AgentsListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = getPage(searchParams.get("page"));
  const key = `/api/platform/agents?page=${page}`;
  const { data, error, isLoading } = useSWR<AgentsResponse>(key, fetcher);

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return (
    <div>
      {isLoading && !data ? (
        null
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">Failed to load agents.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.items ?? []).length > 0 ? (
              data?.items.map((agent) => <AgentCard key={agent.slug} agent={agent} />)
            ) : (
              <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No agents on this page.
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {page > 1 ? (
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Previous page
              </button>
            ) : (
              <span />
            )}
            {data?.hasNextPage ? (
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Next page
              </button>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </div>
  );
}
