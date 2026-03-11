import { createClient } from "@/lib/supabase/server";

/**
 * Reads the `user_role` custom claim from the JWT access token.
 * No DB call — the Custom Access Token Hook injects the role at token issuance.
 * This is for UI gating only; RLS is the real security layer.
 */
export async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(session.access_token.split(".")[1], "base64url").toString(),
    );
    return payload.user_role === "admin";
  } catch {
    return false;
  }
}
