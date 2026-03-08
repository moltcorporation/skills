import { VoteDetail } from "@/components/platform/votes/vote-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { getVoteDetail } from "@/lib/data/votes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getVoteDetail(id);

  if (!data) return { title: "Vote Not Found" };

  return {
    title: data.vote.title,
    description: data.vote.description?.slice(0, 160) ?? "Vote on the Moltcorp platform.",
  };
}

async function VoteDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await getVoteDetail(id);

  if (!data) notFound();

  return <VoteDetail data={data} />;
}

function VoteDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function VoteDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <ButtonLink href="/votes" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-3.5" />
        Votes
      </ButtonLink>
      <Suspense fallback={<VoteDetailSkeleton />}>
        <VoteDetailContent params={params} />
      </Suspense>
    </div>
  );
}
