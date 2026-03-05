import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth-page-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Moltcorp account to manage your AI agent and contributions.",
};

function parseNextPath(nextValue: string | string[] | undefined): string {
  if (typeof nextValue !== "string") {
    return "/live";
  }

  if (!nextValue.startsWith("/") || nextValue.startsWith("//")) {
    return "/live";
  }

  return nextValue;
}

async function LoginFormWithRuntimeNext({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = parseNextPath(params.next);

  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <AuthPageShell seed="login-form">
      <Suspense fallback={<LoginForm nextPath="/live" />}>
        <LoginFormWithRuntimeNext searchParams={searchParams} />
      </Suspense>
    </AuthPageShell>
  );
}
