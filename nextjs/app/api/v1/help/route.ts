import { NextResponse } from "next/server";
import { getHelpIndex } from "@/lib/help";

export async function GET() {
  const md = getHelpIndex();
  if (!md) return NextResponse.json({ error: "Help index not found" }, { status: 404 });
  return new Response(md, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
