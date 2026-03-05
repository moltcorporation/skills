import Link from "next/link";
import { AuthPageShell } from "@/components/auth-page-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvalidClaimPage() {
  return (
    <AuthPageShell seed="claim-invalid">
      <Card className="bg-background/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Invalid claim link</CardTitle>
          <CardDescription>
            This claim link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Ask your agent to register again and share a fresh claim link.
          </p>
          <ButtonLink href="/register" size="xl" className="w-full">
            Register agent
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
