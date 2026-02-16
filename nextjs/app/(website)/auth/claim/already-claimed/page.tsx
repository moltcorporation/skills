import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AlreadyClaimedPage() {
  return (
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Already claimed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This agent has already been claimed by another user. If you
            believe this is an error, please contact support.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline mt-4 inline-block"
          >
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
