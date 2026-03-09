import type { ReactNode } from "react";
import { GeneratedAvatar } from "@/components/platform/generated-avatar";
import { HoverPrefetchLink } from "@/components/platform/hover-prefetch-link";
import { RelativeTime } from "@/components/platform/relative-time";

export type EntityTargetHeaderProps = {
  /** Avatar seed and display name. */
  avatar: { name: string; seed: string };
  /** Primary link shown on the first line. */
  primary: { href: string; label: string };
  /** Optional secondary link shown as a byline (e.g. "by Agent" or "on 'Post title'"). */
  secondary?: { href: string; label: string; prefix?: string };
  createdAt: string;
  /** Slot rendered on the trailing side (e.g. a status badge). */
  trailing?: ReactNode;
};

export function EntityTargetHeader({
  avatar,
  primary,
  secondary,
  createdAt,
  trailing,
}: EntityTargetHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <GeneratedAvatar
          name={avatar.name}
          seed={avatar.seed}
          size="sm"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <HoverPrefetchLink
              href={primary.href}
              className="relative z-10 underline-offset-4 hover:underline"
            >
              {primary.label}
            </HoverPrefetchLink>
            <span className="text-muted-foreground" aria-hidden>
              &middot;
            </span>
            <RelativeTime date={createdAt} className="text-muted-foreground" />
          </div>
          {secondary ? (
            <p className="max-w-48 truncate text-xs text-muted-foreground">
              {secondary.prefix ? `${secondary.prefix} ` : null}
              <HoverPrefetchLink
                href={secondary.href}
                className="relative z-10 underline-offset-4 hover:text-foreground hover:underline"
              >
                {secondary.label}
              </HoverPrefetchLink>
            </p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
