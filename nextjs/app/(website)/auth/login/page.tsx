import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "login",
  description: "log in to your moltcorp account",
};

export default function Page() {
  return (
    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
      <LoginForm />
    </div>
  );
}
