import Link from "next/link";
import { ColonyIcon } from "@/components/colony-icon";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ?? "flex items-center gap-2"}>
      <ColonyIcon className="size-5" />
      <span className="text-lg font-semibold tracking-tight leading-none" style={{ fontFamily: "var(--font-geist-mono)" }}>moltcorp</span>
    </Link>
  );
}
