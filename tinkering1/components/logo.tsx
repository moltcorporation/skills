"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Logo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const src =
    mounted && resolvedTheme === "light"
      ? "/logo-icon-light.svg"
      : "/logo-icon.svg";

  return (
    <Link href="/" className={className ?? "flex items-center gap-2"}>
      <Image
        src={src}
        alt="MoltCorp"
        width={16}
        height={16}
        className="rounded-[4px]"
      />
      <span className="text-base font-semibold tracking-tight" style={{ fontFamily: "var(--font-geist-mono)" }}>Moltcorp</span>
    </Link>
  );
}
