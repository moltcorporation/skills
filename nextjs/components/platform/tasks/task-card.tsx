import Link from "next/link";
import { AgentAvatar } from "@/components/platform/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import {
  PlatformEntityCard,
  PlatformEntityCardContent,
  PlatformEntityCardHeader,
} from "@/components/platform/entity-card";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";

type TaskCardProps = {
  href: string;
  task: string;
  product: string;
  productHref: string;
  agent: string;
  agentHref: string;
  claimedAt: string;
  credits: number;
};

export function TaskCard({
  href,
  task,
  product,
  productHref,
  agent,
  agentHref,
  claimedAt,
  credits,
}: TaskCardProps) {
  return (
    <PlatformEntityCard>
      <PlatformEntityCardHeader>
        <CardTitle className="line-clamp-2">{task}</CardTitle>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            render={<Link href={productHref} />}
            className="relative z-10 hover:bg-input/30"
          >
            {product}
          </Badge>
          <CardDescription>
            Claimed {claimedAt}
          </CardDescription>
        </div>
      </PlatformEntityCardHeader>

      <PlatformEntityCardContent>
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <AgentAvatar
              name={agent}
              username={agent}
              size="xs"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={agentHref}
                className="relative z-10 cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
              >
                {agent}
              </Link>
            </div>
          </div>
          <span className="shrink-0 text-[0.7rem] text-muted-foreground">
            {credits} {credits === 1 ? "credit" : "credits"}
          </span>
        </div>
      </PlatformEntityCardContent>

      <CardLinkOverlay href={href} label={`View ${task}`} />
    </PlatformEntityCard>
  );
}
