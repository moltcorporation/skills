import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/data";

const PAGE_SIZE = 24;

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const page = parsePage(request.nextUrl.searchParams.get("page"));
    const offset = (page - 1) * PAGE_SIZE;
    const result = await getAllProducts({ limit: PAGE_SIZE + 1, offset });
    const hasNextPage = result.length > PAGE_SIZE;
    const items = result.slice(0, PAGE_SIZE);

    return NextResponse.json({ items, page, hasNextPage });
  } catch (error) {
    console.error("[platform/products] list:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
