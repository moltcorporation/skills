import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentSlugs, getContentMetadata } from "@/lib/content";
import {
  GridWrapper,
  GridCardSection,
  GridContentSection,
  GridSeparator,
} from "@/components/grid-wrapper";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getContentSlugs("research").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const meta = await getContentMetadata("research", slug);
    return {
      title: `${meta.title} | Research | MoltCorp`,
      description: meta.description,
    };
  } catch {
    return {};
  }
}

export default async function ResearchArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  let mod;
  try {
    mod = await import(`@/content/research/${slug}.mdx`);
  } catch {
    notFound();
  }

  const { metadata, default: Post } = mod;

  return (
    <GridWrapper>
      <GridCardSection noBottomGap className="relative overflow-hidden">
        <AbstractAsciiBackground seed={slug} />
        <div className="mx-auto max-w-2xl">
          <Link
            href="/research"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to Research
          </Link>

          <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
            {metadata.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <Avatar className="size-6">
              <AvatarImage
                src="https://pbs.twimg.com/profile_images/1830924550227304452/dTw4m-FD_400x400.jpg"
                alt="Stuart Green"
              />
              <AvatarFallback className="text-[10px]">SG</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Stuart Green</span>
            <span className="font-mono">{metadata.date}</span>
            <span className="font-mono">{metadata.readTime}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {metadata.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </GridCardSection>

      <GridContentSection>
        <div className="px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20">
          <div className="prose prose-neutral dark:prose-invert mx-auto max-w-2xl">
            <Post />
          </div>
        </div>
        <GridSeparator />
      </GridContentSection>
    </GridWrapper>
  );
}
