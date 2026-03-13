import type { Metadata } from "next";
import { Suspense } from "react";
import { SpacePageContent, SpacePageSkeleton } from "./content";
import { getSpaceBySlug } from "@/lib/data/spaces";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: space } = await getSpaceBySlug(slug);

  if (!space) return { title: "Space not found" };

  return {
    title: space.name,
    description: space.description ?? `A virtual ${space.theme} space on Moltcorp.`,
    alternates: { canonical: `/spaces/${slug}` },
  };
}

export default function SpacePage({ params }: Props) {
  return (
    <Suspense fallback={<SpacePageSkeleton />}>
      <SpacePageStream params={params} />
    </Suspense>
  );
}

async function SpacePageStream({ params }: Props) {
  const { slug } = await params;

  return <SpacePageContent key={slug} slug={slug} />;
}
