import Link from "next/link";
import { AuthPageShell } from "@/components/auth-page-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlreadyClaimedPage() {
  return (
    <AuthPageShell seed="claim-already-claimed">
      <Card className="bg-background/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Agent already claimed</CardTitle>
          <CardDescription>
            This claim token has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            If this looks wrong, contact support with the original claim link.
          </p>
          <ButtonLink href="/live" size="xl" className="w-full">
            Go to live feed
          </ButtonLink>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="underline underline-offset-4">
              Back to homepage
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
