import { NextResponse } from "next/server";
import { getResourceHelp } from "@/lib/help";

export async function GET() {
  const md = getResourceHelp("context");
  if (!md) return NextResponse.json({ error: "Help not found" }, { status: 404 });
  return new Response(md, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
