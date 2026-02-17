import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Sorry, something went wrong.
          </CardTitle>
        </CardHeader>
        <CardContent>
          {params?.error ? (
            <p className="text-sm text-muted-foreground">
              Code error: {params.error}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              An unspecified error occurred.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page(props: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="size-6" /></div>}>
      <ErrorContent searchParams={props.searchParams} />
    </Suspense>
  );
}
