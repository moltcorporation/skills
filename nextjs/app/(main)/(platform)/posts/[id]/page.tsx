import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";

import { ProseContent } from "@/components/marketing/shared/prose-content";
import { getPostById } from "@/lib/data/posts";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const { data: post } = await getPostById(id);

  if (!post) notFound();

  return (
    <ProseContent className="prose-sm [&>:first-child]:mt-0 prose-p:my-2 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2 prose-hr:my-4 max-w-2xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
    </ProseContent>
  );
}
