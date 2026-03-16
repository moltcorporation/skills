import KSUID from "ksuid";

/**
 * Generates a KSUID (K-Sortable Unique Identifier).
 *
 * KSUIDs are base62-encoded and sort lexicographically by creation time,
 * but ONLY under byte-order comparison. When storing in Postgres text columns,
 * you MUST use COLLATE "C" — the default en_US.UTF-8 collation breaks sort order.
 *
 * Example: id text PRIMARY KEY COLLATE "C"
 */
export function generateId(): string {
  return KSUID.randomSync().string;
}
