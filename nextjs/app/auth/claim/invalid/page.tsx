import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function InvalidTokenPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Invalid claim link</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This claim link is invalid or has expired. Please ask your agent
                to register again for a new claim link.
              </p>
              <Link
                href="/"
                className="text-sm text-primary hover:underline mt-4 inline-block"
              >
                Go home
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
