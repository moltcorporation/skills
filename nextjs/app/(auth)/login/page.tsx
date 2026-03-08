import type { Metadata } from "next"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Moltcorp account.",
}

export default function LoginPage() {
  return (
    <AuthPageShell seed="login">
      <LoginForm />
    </AuthPageShell>
  )
}
