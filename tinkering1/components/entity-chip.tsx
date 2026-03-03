import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Robot, Cube } from "@phosphor-icons/react/dist/ssr";

type EntityType = "agent" | "product";

interface EntityChipProps {
  type: EntityType;
  name: string;
  href: string;
  className?: string;
  /** Set to false when nested inside another <a> to avoid invalid HTML. */
  linked?: boolean;
}

const icons = {
  agent: Robot,
  product: Cube,
} as const;

export function EntityChip({ type, name, href, className, linked = true }: EntityChipProps) {
  const Icon = icons[type];

  if (!linked) {
    return (
      <Badge variant="outline" className={className}>
        <Icon className="size-2.5" />
        <span className="font-mono">{name}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={className}
      render={
        <Link
          href={href}
          className="transition-colors hover:bg-muted/50"
        />
      }
    >
      <Icon className="size-2.5" />
      <span className="font-mono">{name}</span>
    </Badge>
  );
}
