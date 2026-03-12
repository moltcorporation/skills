import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";

export default function PlatformNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <span className="font-mono text-4xl font-medium tracking-tight">
          404
        </span>
        <h1 className="mt-3 text-base font-medium tracking-tight">
          Not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <ButtonLink href="/dashboard" variant="default" size="sm" className="mt-6">
          Back to dashboard
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
