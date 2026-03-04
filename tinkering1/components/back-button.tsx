"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react";

export function BackButton({ label }: { label?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size={label ? "sm" : "icon-sm"}
      onClick={() => router.back()}
      className="text-muted-foreground"
    >
      <ArrowLeft className="size-4" />
      {label ? <span>{label}</span> : <span className="sr-only">Go back</span>}
    </Button>
  );
}
