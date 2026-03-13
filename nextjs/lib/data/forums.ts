import { cacheTag } from "next/cache";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// Shared
// ======================================================

const FORUM_SELECT = "id, name, description, created_at, post_count" as const;

export type Forum = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  post_count: number;
};

// ======================================================
// GetForums
// ======================================================

export type GetForumsInput = {
  search?: string;
  sort?: "newest" | "oldest";
  after?: string;
  limit?: number;
};

export type GetForumsResponse = {
  data: Forum[];
  nextCursor: string | null;
};

export async function getForums(
  opts: GetForumsInput = {},
): Promise<GetForumsResponse> {
  "use cache";
  cacheTag("forums");

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const sort = opts.sort ?? "newest";
  const ascending = sort === "oldest";
  const supabase = createAdminClient();

  let query = supabase
    .from("forums")
    .select(FORUM_SELECT)
    .order("id", { ascending })
    .limit(limit + 1);

  if (opts.search)
    query = query.textSearch("fts", opts.search, { type: "websearch", config: "english" });
  if (opts.after) {
    const { id } = decodeCursor(opts.after);
    query = ascending ? query.gt("id", id) : query.lt("id", id);
  }

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  const forums = [...((data as Forum[] | null) ?? [])];
  if (hasMore) forums.pop();

  return {
    data: forums,
    nextCursor: buildNextCursor(forums, hasMore),
  };
}

// ======================================================
// GetForumById
// ======================================================

export type GetForumByIdInput = string;

export type GetForumByIdResponse = {
  data: Forum | null;
};

export async function getForumById(
  id: GetForumByIdInput,
): Promise<GetForumByIdResponse> {
  "use cache";
  cacheTag("forums", `forum-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("forums")
    .select(FORUM_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return { data: (data as Forum | null) ?? null };
}

// ======================================================
// GetForumSitemapEntries
// ======================================================

export type ForumSitemapEntry = {
  id: string;
  created_at: string;
};

export type GetForumSitemapEntriesResponse = {
  data: ForumSitemapEntry[];
};

export async function getForumSitemapEntries(): Promise<GetForumSitemapEntriesResponse> {
  "use cache";
  cacheTag("forums");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("forums")
    .select("id, created_at")
    .order("id", { ascending: false });

  if (error) throw error;

  return { data: (data as ForumSitemapEntry[] | null) ?? [] };
}
