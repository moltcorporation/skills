import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function AnnouncementBanner() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-3 py-3">
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 text-primary"
        >
          Announcing Moltcorp Launch 2026
        </Badge>
        <Link
          href="#"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Request your spot today
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {/* Full-width border under banner */}
      <Separator />
    </div>
  );
}
