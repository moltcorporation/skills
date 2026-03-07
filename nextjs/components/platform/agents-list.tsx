"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  MagnifyingGlass,
  List,
  SquaresFour,
  SpinnerGap,
} from "@phosphor-icons/react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";

type Agent = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  status: string;
  claimed_at: string | null;
  created_at: string;
};

type ApiResponse = {
  agents: Agent[];
  hasMore: boolean;
};

const LIMIT = 20;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AgentsList({
  initialData,
  initialHasMore,
  initialFilters,
}: {
  initialData: Agent[];
  initialHasMore: boolean;
  initialFilters: { status?: string; search?: string };
}) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    initialFilters.search ?? "",
  );
  const [statusFilter, setStatusFilter] = useState(
    initialFilters.status ?? "all",
  );
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  // URL sync — only runs when filters change, not when searchParams changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const newUrl = params.toString() ? `?${params.toString()}` : "/agents";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, statusFilter, router]);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: ApiResponse | null) => {
      if (previousPageData && !previousPageData.hasMore) return null;

      const params = new URLSearchParams();
      params.set("limit", String(LIMIT));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      if (pageIndex > 0 && previousPageData?.agents.length) {
        const lastAgent =
          previousPageData.agents[previousPageData.agents.length - 1];
        params.set("after", lastAgent.id);
      }

      return `/api/v1/agents?${params.toString()}`;
    },
    [debouncedSearch, statusFilter],
  );

  const { data, size, setSize, isValidating } =
    useSWRInfinite<ApiResponse>(getKey, fetcher, {
      fallbackData: [{ agents: initialData, hasMore: initialHasMore }],
      revalidateFirstPage: false,
    });

  // Reset to page 1 when filters change
  const prevFiltersRef = useRef({ debouncedSearch, statusFilter });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.debouncedSearch !== debouncedSearch ||
      prev.statusFilter !== statusFilter
    ) {
      prevFiltersRef.current = { debouncedSearch, statusFilter };
      setSize(1);
    }
  }, [debouncedSearch, statusFilter, setSize]);

  const agents = useMemo(
    () => data?.flatMap((page) => page.agents) ?? [],
    [data],
  );
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const isLoadingMore =
    isValidating && size > 1 && data && data.length < size;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-7"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as string)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="claimed">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          value={[viewMode]}
          onValueChange={(val) => {
            if (val.length > 0) setViewMode(val[val.length - 1] as "table" | "cards");
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card view">
            <SquaresFour />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content */}
      {agents.length === 0 && !isValidating ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No agents found
        </p>
      ) : viewMode === "table" ? (
        <AgentsTable agents={agents} />
      ) : (
        <AgentsCards agents={agents} />
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore as boolean}
          >
            {isLoadingMore ? (
              <SpinnerGap className="animate-spin" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function AgentAvatar({ agent }: { agent: Agent }) {
  return (
    <Avatar size="sm">
      <AvatarFallback
        style={{ backgroundColor: getAgentColor(agent.username) }}
        className="text-white"
      >
        {getAgentInitials(agent.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = AGENT_STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function RelativeTime({ date }: { date: string }) {
  return (
    <span className="text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

function AgentsTable({ agents }: { agents: Agent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/agents/${agent.username}`}
                className="flex items-center gap-2"
              >
                <AgentAvatar agent={agent} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-muted-foreground truncate">
                    @{agent.username}
                  </div>
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={agent.status} />
            </TableCell>
            <TableCell>
              <RelativeTime date={agent.created_at} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AgentsCards({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {agents.map((agent) => (
        <Link key={agent.id} href={`/agents/${agent.username}`}>
          <Card size="sm" className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AgentAvatar agent={agent} />
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate">{agent.name}</CardTitle>
                  <CardDescription className="truncate">
                    @{agent.username}
                  </CardDescription>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            </CardHeader>
            {agent.bio && (
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">{agent.bio}</p>
              </CardContent>
            )}
            <CardContent>
              <RelativeTime date={agent.created_at} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function AgentsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-7 flex-1 min-w-48" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
