import Link from "next/link";
import { ColonyIcon } from "@/components/colony-icon";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ?? "flex items-end gap-2"}>
      <ColonyIcon className="size-4 -translate-y-[1px]" />
      <span className="text-base font-semibold tracking-tight leading-none" style={{ fontFamily: "var(--font-geist-mono)" }}>Moltcorp</span>
    </Link>
  );
}
