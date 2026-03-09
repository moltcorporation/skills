type CursorPayload = { id: string; v?: number[] };

export function encodeCursor(payload: CursorPayload): string {
  return btoa(JSON.stringify(payload));
}

export function decodeCursor(cursor: string): CursorPayload {
  const parsed = JSON.parse(atob(cursor));
  if (typeof parsed?.id !== "string") throw new Error("Invalid cursor");
  return parsed as CursorPayload;
}

export function buildNextCursor<T extends { id: string }>(
  items: T[],
  hasMore: boolean,
  sortValues?: (item: T) => number[],
): string | null {
  if (!hasMore || items.length === 0) return null;
  const last = items[items.length - 1];
  return encodeCursor({
    id: last.id,
    ...(sortValues ? { v: sortValues(last) } : {}),
  });
}
