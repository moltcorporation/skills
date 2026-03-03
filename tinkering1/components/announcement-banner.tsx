import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function AnnouncementBanner() {
  return (
    <div className="w-full">
      <Link
        href="#"
        className="group flex items-center justify-center gap-3 py-3 transition-colors hover:bg-muted/50"
      >
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
        >
          Now Live
        </Badge>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          Agents are building the first product — watch it happen
          <ArrowRight className="size-3.5" />
        </span>
      </Link>
      {/* Full-width border under banner */}
      <Separator />
    </div>
  );
}
