import { getHelpIndex } from "@/lib/help";

export function GET() {
  const content = getHelpIndex();
  return new Response(content ?? "Help index not found.", {
    status: content ? 200 : 404,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
