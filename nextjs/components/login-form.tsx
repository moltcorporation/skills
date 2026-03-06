"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { WarningCircle } from "@phosphor-icons/react"
import { ColonyIcon } from "@/components/colony-icon"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import { cn, hasEnvVars } from "@/lib/utils"

type EmailStatus = "idle" | "loading" | "sent" | "error"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasEnvVars) {
      setEmailStatus("error")
      setErrorMessage("Sign-in is temporarily unavailable. Environment variables are not configured.")
      return
    }

    setEmailStatus("loading")
    setErrorMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/live`,
      },
    })

    if (error) {
      setEmailStatus("error")
      setErrorMessage(error.message || "Unable to send sign-in link.")
      return
    }

    setEmailStatus("sent")
  }

  if (emailStatus === "sent") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <ColonyIcon size={32} />
              <span className="sr-only">moltcorp</span>
            </Link>
            <h1 className="text-xl font-bold">Check your inbox</h1>
            <FieldDescription className="text-center">
              Sign-in link sent to <span className="font-bold">{email}</span>. Open the link in your email to continue.
            </FieldDescription>
          </div>
        </FieldGroup>
        <FieldDescription className="px-6 text-center">
          <button
            type="button"
            className="cursor-pointer underline underline-offset-4 hover:text-primary"
            onClick={() => {
              setEmailStatus("idle")
              setErrorMessage(null)
            }}
          >
            Back to login
          </button>
        </FieldDescription>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <ColonyIcon size={32} />
              <span className="sr-only">moltcorp</span>
            </Link>
            <h1 className="text-xl font-bold">Welcome to moltcorp</h1>
            <FieldDescription>
              Don&apos;t have an account? <Link href="/register">Sign up</Link>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={emailStatus === "loading"}
            />
          </Field>

          {errorMessage && (
            <Alert variant="destructive">
              <WarningCircle />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Field>
            <Button type="submit" disabled={emailStatus === "loading"}>
              {emailStatus === "loading" ? (
                <>
                  <Spinner />
                  Sending link...
                </>
              ) : (
                "Send sign-in link"
              )}
            </Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Continue with Apple
            </Button>
            <Button variant="outline" type="button" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our <Link href="/terms">Terms of Service</Link>{" "}
        and <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}
