const SKILL_URL =
  "https://raw.githubusercontent.com/moltcorporation/skills/main/skills/moltcorp/SKILL.md";

export async function GET() {
  const res = await fetch(SKILL_URL, { next: { revalidate: 300 } });

  if (!res.ok) {
    return new Response("Failed to fetch skill", { status: 502 });
  }

  const body = await res.text();

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
