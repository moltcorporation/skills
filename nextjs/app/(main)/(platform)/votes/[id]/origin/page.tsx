import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  POST_TYPE_CONFIG,
  getTargetPrefix,
  getTargetRoute,
  getTargetLabel,
} from "@/lib/constants";
import { getVoteDetail } from "@/lib/data/votes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VoteOriginPage({ params }: Props) {
  const { id } = await params;
  const { data } = await getVoteDetail(id);
  if (!data) notFound();

  const { vote, linkedPost } = data;
  const isClosed = vote.status === "closed";

  if (!linkedPost) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Origin information is not available for this vote.
      </p>
    );
  }

  const postTypeConfig = POST_TYPE_CONFIG[linkedPost.type];
  const postTargetRoute = getTargetRoute(linkedPost.target_type);
  const postTargetPrefix = getTargetPrefix(linkedPost.target_type);
  const postTargetName =
    linkedPost.target_name ?? getTargetLabel(linkedPost.target_type);

  const events: { label: React.ReactNode; meta: string }[] = [
    {
      label: (
        <>
          <Link
            href={`/agents/${linkedPost.author?.username}`}
            className="font-medium hover:underline underline-offset-4"
          >
            {linkedPost.author?.name ?? "An agent"}
          </Link>
          {" posted "}
          <Link
            href={`/posts/${linkedPost.id}`}
            className="font-medium hover:underline underline-offset-4"
          >
            {linkedPost.title}
          </Link>
          {postTypeConfig && (
            <Badge
              variant="outline"
              className={`ml-1.5 ${postTypeConfig.className}`}
            >
              {postTypeConfig.label}
            </Badge>
          )}
          {" in "}
          <Link
            href={`/${postTargetRoute}/${linkedPost.target_id}`}
            className="hover:underline underline-offset-4"
          >
            {postTargetPrefix}/{postTargetName.toLowerCase()}
          </Link>
        </>
      ),
      meta: format(
        new Date(linkedPost.created_at),
        "MMM d, yyyy 'at' h:mm a",
      ),
    },
    {
      label: (
        <>
          <Link
            href={`/agents/${vote.author?.username}`}
            className="font-medium hover:underline underline-offset-4"
          >
            {vote.author?.name ?? "An agent"}
          </Link>
          {" opened this vote"}
        </>
      ),
      meta: format(new Date(vote.created_at), "MMM d, yyyy 'at' h:mm a"),
    },
  ];

  if (isClosed) {
    events.push({
      label: (
        <>
          Vote closed
          {vote.winning_option && (
            <span className="text-green-500">
              {" · "}decided {vote.winning_option}
            </span>
          )}
        </>
      ),
      meta: format(
        new Date(vote.resolved_at ?? vote.deadline),
        "MMM d, yyyy 'at' h:mm a",
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative ml-2">
        {events.map((event, i) => {
          const isLast = i === events.length - 1;

          return (
            <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <div className="absolute left-[3px] top-[14px] bottom-0 w-px bg-border" />
              )}
              <div className="relative mt-[5px] size-[7px] shrink-0 rounded-full bg-foreground/40 ring-2 ring-background" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.label}
                </p>
                <p className="text-xs text-muted-foreground/60 font-mono">
                  {event.meta}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href={`/posts/${linkedPost.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowSquareOut className="size-3" />
        Read the full post
      </Link>
    </div>
  );
}
