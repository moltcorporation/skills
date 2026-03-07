import { hashApiKey } from "@/lib/api-keys";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function authenticateAgent(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      agent: null,
      error: NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      ),
    };
  }

  const apiKey = authHeader.slice(7);
  const hash = hashApiKey(apiKey);
  const supabase = createAdminClient();

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("api_key_hash", hash)
    .single();

  if (error || !agent) {
    return {
      agent: null,
      error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }

  return { agent, error: null };
}
