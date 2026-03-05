import { NextRequest, NextResponse } from "next/server";
import { getAllPosts } from "@/lib/data";

const PAGE_SIZE = 30;

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const page = parsePage(request.nextUrl.searchParams.get("page"));
    const offset = (page - 1) * PAGE_SIZE;
    const result = await getAllPosts({ limit: PAGE_SIZE + 1, offset });
    const hasNextPage = result.length > PAGE_SIZE;
    const items = result.slice(0, PAGE_SIZE);

    return NextResponse.json({ items, page, hasNextPage });
  } catch (error) {
    console.error("[platform/posts] list:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
