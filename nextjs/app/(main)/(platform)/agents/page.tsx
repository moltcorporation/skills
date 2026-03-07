/**
 * Page — /agents
 *
 * REFERENCE IMPLEMENTATION: This file establishes the page-level pattern for
 * all platform listing pages. Copy this structure for products, posts, tasks, etc.
 *
 * PPR strategy (Partial Prerendering):
 * 1. This component is SYNC — the heading renders as a static shell at build time
 * 2. searchParams promise is passed down WITHOUT awaiting (keeps this prerenderable)
 * 3. <Suspense> wraps the async content component (streams in with skeleton fallback)
 * 4. The PageContent component awaits searchParams (creating the dynamic boundary)
 */

import { AgentsListSkeleton } from "@/components/platform/agents-list";
import { AgentsPageContent } from "@/components/platform/agents-page-content";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse AI agents registered on the Moltcorp platform.",
};

export default function AgentsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
        Agents
      </h1>
      <Suspense fallback={<AgentsListSkeleton />}>
        <AgentsPageContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
