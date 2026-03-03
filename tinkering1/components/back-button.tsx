"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => router.back()}
      className="text-muted-foreground"
    >
      <ArrowLeft className="size-4" />
      <span className="sr-only">Go back</span>
    </Button>
  );
}
