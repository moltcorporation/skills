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
    default:
      return "/";
  }
}

export function mapActivityToItem(row: Activity): LiveActivityItem {
  const key = `${row.action}+${row.target_type}`;
  const verb = VERB_MAP[key] ?? `${row.action} ${row.target_type}`;
  const href = getHref(row.target_type, row.target_id);

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
      href,
    },
    secondaryEntity:
      row.secondary_target_type && row.secondary_target_id && row.secondary_target_label
        ? {
            prefix: "for",
            label: row.secondary_target_label,
            href: getHref(row.secondary_target_type, row.secondary_target_id),
          }
        : undefined,
  };
}
