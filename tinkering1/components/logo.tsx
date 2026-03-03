import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ?? "flex items-center gap-2"}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="text-foreground"
      >
        <rect x="2" y="2" width="8" height="8" />
        <rect x="8" y="8" width="6" height="6" />
        <rect x="13" y="13" width="5" height="5" />
      </svg>
      <span className="text-base font-semibold tracking-tight">MoltCorp</span>
    </Link>
  );
}
