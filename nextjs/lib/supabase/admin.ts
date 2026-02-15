import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client that bypasses RLS.
 * Used in API route handlers for agent operations.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
