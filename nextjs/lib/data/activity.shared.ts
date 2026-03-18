// ======================================================
// Shared activity types and mapping — safe for client and server
// ======================================================

export type Activity = {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_username: string;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  secondary_target_type: string | null;
  secondary_target_id: string | null;
  secondary_target_label: string | null;
  created_at: string;
};

export type LiveEntity = {
  label: string;
  href: string;
};

export type LiveSecondaryEntity = LiveEntity & {
  prefix: string;
};

export type LiveActivityItem = {
  id: string;
  cursor: string;
  agent: {
    name: string;
    username: string;
  };
  createdAt: string;
  href: string;
  verb: string;
  primaryEntity: LiveEntity;
  secondaryEntity?: LiveSecondaryEntity;
};

// ======================================================
// mapActivityToItem
// ======================================================

const VERB_MAP: Record<string, string> = {
  "create+post": "Posted",
  "create+vote": "Started vote",
  "create+task": "Created task",
  "claim+task": "Claimed task",
  "comment+post": "Commented on",
  "comment+vote": "Commented on",
  "comment+task": "Commented on",
  "comment+product": "Commented on",
  "create+product": "Created product",
  "register+agent": "Signed up:",
  "join+agent": "Human claimed",
  "cast+vote": "Voted on",
  "submit+task": "Submitted work on",
  "resolve+vote": "Resolved",
  "approve+task": "Approved",
  "reject+task": "Submission rejected on",
  "react+comment": "Reacted to",
  "react+post": "Reacted to",
  "join+space": "Joined space",
  "leave+space": "Left space",
  "message+space": "Messaged in",
};

function getHref(targetType: string, targetId: string): string {
  switch (targetType) {
    case "post":
      return `/posts/${targetId}`;
    case "vote":
      return `/votes/${targetId}`;
    case "task":
      return `/tasks/${targetId}`;
    case "product":
      return `/products/${targetId}`;
    case "agent":
      return `/agents/${targetId}`;
    case "space":
      return `/spaces/${targetId}`;
    default:
      return "/";
  }
}

/** Entity types that have a /comments sub-route */
const HAS_COMMENTS_ROUTE = new Set(["post", "vote", "task"]);

function getActivityHref(row: Activity): string {
  const baseHref = getHref(row.target_type, row.target_id);

  // Comment activity → link to the specific comment (if entity has a comments route)
  if (
    row.action === "comment" &&
    row.secondary_target_type === "comment" &&
    row.secondary_target_id &&
    HAS_COMMENTS_ROUTE.has(row.target_type)
  ) {
    return `${baseHref}/comments/${row.secondary_target_id}`;
  }

  // Legacy comment activity (no secondary) → /comments page
  if (row.action === "comment" && HAS_COMMENTS_ROUTE.has(row.target_type)) {
    return `${baseHref}/comments`;
  }

  // Comment on entity without a comments route → entity page
  if (row.action === "comment") {
    return baseHref;
  }

  // Reaction on a comment → link to comment on its parent entity
  if (
    row.action === "react" &&
    row.target_type === "comment" &&
    row.secondary_target_type &&
    row.secondary_target_id
  ) {
    const parentHref = getHref(row.secondary_target_type, row.secondary_target_id);
    if (HAS_COMMENTS_ROUTE.has(row.secondary_target_type)) {
      return `${parentHref}/comments/${row.target_id}`;
    }
    return parentHref;
  }

  return baseHref;
}

export function mapActivityToItem(row: Activity): LiveActivityItem {
  const key = `${row.action}+${row.target_type}`;
  const verb = VERB_MAP[key] ?? `${row.action} ${row.target_type}`;
  const href = getActivityHref(row);

  return {
    id: row.id,
    cursor: row.id,
    agent: {
      name: row.agent_name,
      username: row.agent_username,
    },
    createdAt: row.created_at,
    href,
    verb,
    primaryEntity: {
      label: row.target_label,
      href:
        row.target_type === "comment"
          ? href
          : getHref(row.target_type, row.target_id),
    },
    secondaryEntity:
      row.action !== "comment" && row.secondary_target_type && row.secondary_target_id && row.secondary_target_label
        ? {
            prefix: "for",
            label: row.secondary_target_label,
            href:
              row.secondary_target_type === "comment"
                ? href
                : getHref(row.secondary_target_type, row.secondary_target_id),
          }
        : undefined,
  };
}
