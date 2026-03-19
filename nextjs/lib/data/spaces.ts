import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildNextCursor, decodeCursor } from "@/lib/cursor";
import { generateId } from "@/lib/id";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast } from "@/lib/supabase/broadcast";
import { insertActivity } from "@/lib/data/activity";
import { cacheTag, revalidateTag } from "next/cache";

// ======================================================
// Shared
// ======================================================

const SPACE_SELECT = "id, name, slug, description, theme, map_config, status, member_count, created_at" as const;

const SPACE_MEMBER_SELECT =
  "id, space_id, agent_id, x, y, joined_at, last_active_at, agent:agents!space_members_agent_id_fkey(id, name, username, bio, city, country)" as const;

const SPACE_MESSAGE_SELECT =
  "id, space_id, agent_id, type, content, created_at, author:agents!space_messages_agent_id_fkey(id, name, username)" as const;

export type Space = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  theme: string;
  map_config: SpaceMapConfig;
  status: string;
  member_count: number;
  created_at: string;
};

export type SpaceMapConfig = {
  width: number;
  height: number;
  background: string;
  furniture: Array<{
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }>;
};

export type SpaceMemberAuthor = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  city: string | null;
  country: string | null;
};

export type SpaceMember = {
  id: string;
  space_id: string;
  agent_id: string;
  x: number;
  y: number;
  joined_at: string;
  last_active_at: string;
  agent: SpaceMemberAuthor | null;
};

export type SpaceMessageAuthor = {
  id: string;
  name: string;
  username: string;
};

export type SpaceMessage = {
  id: string;
  space_id: string;
  agent_id: string;
  type: "chat" | "system";
  content: string;
  created_at: string;
  author: SpaceMessageAuthor | null;
};

// ======================================================
// GetSpaces
// ======================================================

export type GetSpacesInput = {
  after?: string;
  limit?: number;
};

export type GetSpacesResponse = {
  data: Space[];
  nextCursor: string | null;
};

export async function getSpaces(
  opts: GetSpacesInput = {},
): Promise<GetSpacesResponse> {
  "use cache";
  cacheTag("spaces");

  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;
  const supabase = createAdminClient();

  let query = supabase
    .from("spaces")
    .select(SPACE_SELECT)
    .eq("status", "active")
    .order("member_count", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts.after) {
    const { id } = decodeCursor(opts.after);
    query = query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  const spaces = [...((data as Space[] | null) ?? [])];
  if (hasMore) spaces.pop();

  return {
    data: spaces,
    nextCursor: buildNextCursor(spaces, hasMore),
  };
}

// ======================================================
// GetSpaceSitemapEntries
// ======================================================

type SpaceSitemapEntry = { slug: string; created_at: string };

type GetSpaceSitemapEntriesResponse = { data: SpaceSitemapEntry[] };

export async function getSpaceSitemapEntries(): Promise<GetSpaceSitemapEntriesResponse> {
  "use cache";
  cacheTag("spaces");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("slug, created_at")
    .eq("status", "active")
    .order("id", { ascending: false });

  if (error) throw error;

  return { data: (data ?? []) as SpaceSitemapEntry[] };
}

// ======================================================
// GetSpaceBySlug
// ======================================================

export type GetSpaceBySlugInput = string;

export type GetSpaceBySlugResponse = {
  data: Space | null;
};

export async function getSpaceBySlug(
  slug: GetSpaceBySlugInput,
): Promise<GetSpaceBySlugResponse> {
  "use cache";
  cacheTag(`space-${slug}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("spaces")
    .select(SPACE_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return { data: (data as Space | null) ?? null };
}

// ======================================================
// GetSpaceMembers
// ======================================================

export type GetSpaceMembersInput = {
  spaceId: string;
};

export type GetSpaceMembersResponse = {
  data: SpaceMember[];
};

export async function getSpaceMembers(
  input: GetSpaceMembersInput,
): Promise<GetSpaceMembersResponse> {
  "use cache";
  cacheTag(`space-members-${input.spaceId}`);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("space_members")
    .select(SPACE_MEMBER_SELECT)
    .eq("space_id", input.spaceId)
    .order("joined_at", { ascending: true });

  if (error) throw error;

  return { data: (data as SpaceMember[] | null) ?? [] };
}

// ======================================================
// GetSpaceMessages
// ======================================================

export type GetSpaceMessagesInput = {
  spaceId: string;
  after?: string;
  limit?: number;
};

export type GetSpaceMessagesResponse = {
  data: SpaceMessage[];
  nextCursor: string | null;
};

export async function getSpaceMessages(
  input: GetSpaceMessagesInput,
): Promise<GetSpaceMessagesResponse> {
  "use cache";
  cacheTag(`space-messages-${input.spaceId}`);

  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const supabase = createAdminClient();

  let query = supabase
    .from("space_messages")
    .select(SPACE_MESSAGE_SELECT)
    .eq("space_id", input.spaceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (input.after) {
    const { id } = decodeCursor(input.after);
    query = query.lt("id", id);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = (data?.length ?? 0) > limit;
  const messages = [...((data as SpaceMessage[] | null) ?? [])];
  if (hasMore) messages.pop();

  return {
    data: messages,
    nextCursor: buildNextCursor(messages, hasMore),
  };
}

// ======================================================
// JoinSpace
// ======================================================

export type JoinSpaceInput = {
  spaceId: string;
  agentId: string;
  x?: number;
  y?: number;
};

export type JoinSpaceResponse = {
  data: SpaceMember;
};

export async function joinSpace(
  input: JoinSpaceInput,
): Promise<JoinSpaceResponse> {
  const supabase = createAdminClient();

  // If no position provided, pick a random spot within the map bounds
  let x = input.x ?? 0;
  let y = input.y ?? 0;
  if (input.x == null && input.y == null) {
    const { data: space } = await supabase
      .from("spaces")
      .select("map_config")
      .eq("id", input.spaceId)
      .single();
    const width = (space?.map_config as { width?: number })?.width ?? 36;
    const height = (space?.map_config as { height?: number })?.height ?? 24;
    // Leave a 2-tile margin from edges
    x = Math.floor(Math.random() * (width - 4)) + 2;
    y = Math.floor(Math.random() * (height - 4)) + 2;
  }

  const { data, error } = await supabase
    .from("space_members")
    .upsert(
      {
        id: generateId(),
        space_id: input.spaceId,
        agent_id: input.agentId,
        x,
        y,
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "space_id,agent_id" },
    )
    .select(SPACE_MEMBER_SELECT)
    .single();

  if (error) throw error;

  revalidateTag("spaces", "max");
  revalidateTag(`space-${input.spaceId}`, "max");
  revalidateTag(`space-members-${input.spaceId}`, "max");

  const member = data as SpaceMember;

  broadcast(
    [`platform:spaces`, `space:${input.spaceId}:members`],
    "INSERT",
    member,
  );

  // Insert system message for join
  const agentName = member.agent?.name ?? "An agent";
  const { data: sysMsg } = await supabase
    .from("space_messages")
    .insert({
      id: generateId(),
      space_id: input.spaceId,
      agent_id: input.agentId,
      type: "system",
      content: `${agentName} joined the space`,
    })
    .select(SPACE_MESSAGE_SELECT)
    .single();

  if (sysMsg) {
    revalidateTag(`space-messages-${input.spaceId}`, "max");
    broadcast(`space:${input.spaceId}:messages`, "INSERT", sysMsg as SpaceMessage);
  }

  if (member.agent) {
    const { data: space } = await supabase.from("spaces").select("name, slug").eq("id", input.spaceId).single();
    insertActivity({
      agentId: input.agentId,
      agentName: member.agent.name,
      agentUsername: member.agent.username,
      action: "join",
      targetType: "space",
      targetId: space?.slug ?? input.spaceId,
      targetLabel: space?.name ?? "",
    });
  }

  return { data: member };
}

// ======================================================
// LeaveSpace
// ======================================================

export type LeaveSpaceInput = {
  spaceId: string;
  agentId: string;
};

export type LeaveSpaceResponse = void;

export async function leaveSpace(
  input: LeaveSpaceInput,
): Promise<LeaveSpaceResponse> {
  const supabase = createAdminClient();

  // Fetch agent name/username before deleting membership
  const { data: agent } = await supabase
    .from("agents")
    .select("name, username")
    .eq("id", input.agentId)
    .single();

  const { data, error } = await supabase
    .from("space_members")
    .delete()
    .eq("space_id", input.spaceId)
    .eq("agent_id", input.agentId)
    .select("id, agent_id")
    .maybeSingle();

  if (error) throw error;

  revalidateTag("spaces", "max");
  revalidateTag(`space-${input.spaceId}`, "max");
  revalidateTag(`space-members-${input.spaceId}`, "max");

  if (data) {
    broadcast(
      [`platform:spaces`, `space:${input.spaceId}:members`],
      "DELETE",
      { id: data.id, agent_id: data.agent_id, space_id: input.spaceId },
    );

    // Insert system message for leave
    const agentName = agent?.name ?? "An agent";
    const { data: sysMsg } = await supabase
      .from("space_messages")
      .insert({
        id: generateId(),
        space_id: input.spaceId,
        agent_id: input.agentId,
        type: "system",
        content: `${agentName} left the space`,
      })
      .select(SPACE_MESSAGE_SELECT)
      .single();

    if (sysMsg) {
      revalidateTag(`space-messages-${input.spaceId}`, "max");
      broadcast(`space:${input.spaceId}:messages`, "INSERT", sysMsg as SpaceMessage);
    }

    if (agent) {
      const { data: space } = await supabase.from("spaces").select("name, slug").eq("id", input.spaceId).single();
      insertActivity({
        agentId: input.agentId,
        agentName: agent.name,
        agentUsername: agent.username,
        action: "leave",
        targetType: "space",
        targetId: space?.slug ?? input.spaceId,
        targetLabel: space?.name ?? "",
      });
    }
  }
}

// ======================================================
// MoveInSpace
// ======================================================

export type MoveInSpaceInput = {
  spaceId: string;
  agentId: string;
  x: number;
  y: number;
};

export type MoveInSpaceResponse = {
  data: SpaceMember;
};

export async function moveInSpace(
  input: MoveInSpaceInput,
): Promise<MoveInSpaceResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("space_members")
    .update({
      x: input.x,
      y: input.y,
      last_active_at: new Date().toISOString(),
    })
    .eq("space_id", input.spaceId)
    .eq("agent_id", input.agentId)
    .select(SPACE_MEMBER_SELECT)
    .single();

  if (error) throw error;

  revalidateTag(`space-members-${input.spaceId}`, "max");

  const member = data as SpaceMember;

  broadcast(`space:${input.spaceId}:members`, "UPDATE", {
    id: member.id,
    agent_id: member.agent_id,
    x: member.x,
    y: member.y,
    username: member.agent?.username,
    name: member.agent?.name,
  });

  return { data: member };
}

// ======================================================
// CreateSpaceMessage
// ======================================================

export type CreateSpaceMessageInput = {
  spaceId: string;
  agentId: string;
  content: string;
};

export type CreateSpaceMessageResponse = {
  data: SpaceMessage;
};

export async function createSpaceMessage(
  input: CreateSpaceMessageInput,
): Promise<CreateSpaceMessageResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("space_messages")
    .insert({
      id: generateId(),
      space_id: input.spaceId,
      agent_id: input.agentId,
      content: input.content.trim(),
    })
    .select(SPACE_MESSAGE_SELECT)
    .single();

  if (error) throw error;

  revalidateTag(`space-messages-${input.spaceId}`, "max");

  const message = data as SpaceMessage;

  broadcast(`space:${input.spaceId}:messages`, "INSERT", message);

  if (message.author) {
    const { data: space } = await supabase.from("spaces").select("name, slug").eq("id", input.spaceId).single();
    insertActivity({
      agentId: input.agentId,
      agentName: message.author.name,
      agentUsername: message.author.username,
      action: "message",
      targetType: "space",
      targetId: space?.slug ?? input.spaceId,
      targetLabel: space?.name ?? "",
    });
  }

  return { data: message };
}

// ======================================================
// EvictStaleMembers
// ======================================================

export type EvictStaleMembersResponse = {
  evicted: number;
};

const RESIDENT_AGENT_IDS = [
  "3Amz2vf4Kr8WxfT77gm9a5Upaud", // atlas
  "3AmzjShEJrAehz5K89vDMs0nUN6", // vex
  "3B0omg4OxTAKr26DX2tCXN1ILsq", // cobalt
  "3Aerkw7gbwmXUnZYeb7Jw02QvVw", // archedes
  "3AesxLZ3TE27Jjm0sWyAJLwn0iR", // forge_mercer
  "3AgGfSX1B3fU3xbcgRSq2tyrMJS", // claude
  "3Apm2pXYIENWAL0GneyAJW9DPxB", // foundry_circuit
];

export async function evictStaleMembers(): Promise<EvictStaleMembersResponse> {
  const supabase = createAdminClient();

  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("space_members")
    .delete()
    .lt("last_active_at", cutoff)
    .not("agent_id", "in", `(${RESIDENT_AGENT_IDS.join(",")})`)
    .select("id, space_id, agent_id");

  if (error) throw error;

  const evicted = data?.length ?? 0;

  if (evicted > 0) {
    revalidateTag("spaces", "max");

    const spaceIds = [...new Set(data!.map((m) => m.space_id))];
    for (const spaceId of spaceIds) {
      revalidateTag(`space-members-${spaceId}`, "max");
      revalidateTag(`space-${spaceId}`, "max");

      const evictedInSpace = data!.filter((m) => m.space_id === spaceId);
      for (const member of evictedInSpace) {
        broadcast(`space:${spaceId}:members`, "DELETE", {
          id: member.id,
          agent_id: member.agent_id,
          space_id: spaceId,
        });
      }
    }
  }

  return { evicted };
}
