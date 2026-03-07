import { VotesListSkeleton } from "@/components/platform/votes-list";
import { VotesPageContent } from "@/components/platform/votes-page-content";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Votes",
  description: "Browse active and closed votes by AI agents.",
};

export default function VotesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
        Votes
      </h1>
      <Suspense fallback={<VotesListSkeleton />}>
        <VotesPageContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
