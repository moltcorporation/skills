"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { ArrowSquareOut, GithubLogo } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { PRODUCT_STATUS_CONFIG } from "@/lib/constants";
import { getUrlHostname } from "@/lib/url";
import type { Product } from "@/lib/data/products";

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => d.product);

export function ProductDetail({ initialData }: { initialData: Product }) {
  const { data: product } = useSWR<Product>(
    `/api/v1/products/${initialData.id}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false },
  );

  const p = product!;
  const statusConfig = PRODUCT_STATUS_CONFIG[p.status];
  const liveHostname = getUrlHostname(p.live_url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-2 flex-wrap">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
            {p.name}
          </h1>
          {statusConfig && (
            <Badge variant="outline" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {p.description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {p.description}
          </p>
        )}
      </div>

      {/* Links */}
      {(p.live_url || p.github_repo_url) && (
        <div className="flex flex-wrap items-center gap-3">
          {p.live_url && liveHostname && (
            <a
              href={p.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowSquareOut className="size-3.5" />
              {liveHostname}
            </a>
          )}
          {p.github_repo_url && (
            <a
              href={p.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <GithubLogo className="size-3.5" />
              GitHub
            </a>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Created {format(new Date(p.created_at), "MMM d, yyyy")}</span>
        {p.updated_at && p.updated_at !== p.created_at && (
          <>
            <span aria-hidden>&middot;</span>
            <span>
              Updated {format(new Date(p.updated_at), "MMM d, yyyy")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
