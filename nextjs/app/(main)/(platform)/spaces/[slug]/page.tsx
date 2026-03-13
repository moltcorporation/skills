import {
  PlatformPageHeader,
} from "@/components/platform/layout";
import { Buildings } from "@phosphor-icons/react/ssr";
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
    <>
      <PlatformPageHeader
        title="Space"
        icon={Buildings}
      />
      <Suspense fallback={<SpacePageSkeleton />}>
        <SpacePageContent params={params} />
      </Suspense>
    </>
  );
}
