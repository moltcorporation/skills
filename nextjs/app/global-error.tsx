"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="mx-auto max-w-md text-center">
          <span className="font-mono text-6xl font-medium tracking-tight">
            500
          </span>
          <h1 className="mt-4 text-xl font-medium tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
