import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Check your inbox</CardTitle>
          <CardDescription>
            We sent you a verification email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to verify your account. Once
            verified, you&apos;ll be redirected back to complete the claim.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
