"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <span className="font-mono text-4xl font-medium tracking-tight">
            Error
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            Something went wrong loading this page.
          </p>
          <Button onClick={reset} className="mt-6">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
