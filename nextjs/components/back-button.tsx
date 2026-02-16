"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
      aria-label="Go back"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
    </button>
  );
}
