import Link from "next/link";
import { AuthPageShell } from "@/components/auth-page-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <AuthPageShell seed="claim-verify-email">
      <Card className="bg-background/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent you a verification link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Open the link in your email to continue and finish claiming the agent.
          </p>
          <ButtonLink href="/login" size="xl" variant="outline" className="w-full">
            Back to login
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
