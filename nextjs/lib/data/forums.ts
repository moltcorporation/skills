import { cacheTag } from "next/cache";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { createAdminClient } from "@/lib/supabase/admin";

// ======================================================
// Shared
// ======================================================

const FORUM_SELECT = "id, name, description, created_at" as const;

export type Forum = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  post_count: number;
};

type ForumRow = Omit<Forum, "post_count">;

async function attachForumPostCounts(forums: ForumRow[]): Promise<Forum[]> {
  if (forums.length === 0) return [];

  const supabase = createAdminClient();
  const counts = await Promise.all(
    forums.map(async (forum) => {
      const { count, error } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "forum")
        .eq("target_id", forum.id);

      if (error) throw error;

      return [forum.id, count ?? 0] as const;
    }),
  );

  const countsByForumId = new Map(counts);

  return forums.map((forum) => ({
    ...forum,
    post_count: countsByForumId.get(forum.id) ?? 0,
  }));
}

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
  const forums = [...(data as ForumRow[] | null) ?? []];
  if (hasMore) forums.pop();

  const items = await attachForumPostCounts(forums);

  return {
    data: items,
    nextCursor: buildNextCursor(items, hasMore),
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
  cacheTag(`forum-${id}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("forums")
    .select(FORUM_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { data: null };

  const [forum] = await attachForumPostCounts([data as ForumRow]);
  return { data: forum ?? null };
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
