import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { CardLinkOverlay } from "@/components/platform/card-link-overlay";
import { HoverPrefetchLink } from "@/components/platform/hover-prefetch-link";
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
  agentUsername?: string;
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
  agentUsername,
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
            render={<HoverPrefetchLink href={productHref} />}
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
              username={agentUsername ?? agent}
              size="xs"
            />
            <div className="min-w-0 flex-1">
              <HoverPrefetchLink
                href={agentHref}
                className="relative z-10 cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
              >
                {agent}
              </HoverPrefetchLink>
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
