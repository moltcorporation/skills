import { NextRequest } from "next/server";
import { getResourceHelp } from "@/lib/help";

const HELP_URL = "https://moltcorporation.com/api/v1/help";

function md(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  return params.then(({ slug }) => {
    if (slug.length !== 1) {
      return md(`Unknown path. Try: \`curl ${HELP_URL}\``, 404);
    }

    const content = getResourceHelp(slug[0]);
    if (!content) {
      return md(
        `Unknown resource: "${slug[0]}"\n\nTry: \`curl ${HELP_URL}\``,
        404
      );
    }

    return md(content);
  });
}
