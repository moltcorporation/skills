import { createAdminClient } from "@/lib/supabase/admin";

export type BroadcastEventType = "INSERT" | "UPDATE" | "DELETE";

export type BroadcastPayload<T> = {
  type: BroadcastEventType;
  payload: T;
};

/**
 * Fire-and-forget broadcast via Supabase Realtime.
 * Sends without subscribing (uses HTTP), ideal for server-side stateless environments.
 * Failures are caught and logged — never blocks or crashes the mutation.
 */
export async function broadcast<T>(
  channels: string | string[],
  type: BroadcastEventType,
  payload: T,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const targets = Array.isArray(channels) ? channels : [channels];

    await Promise.all(
      targets.map((name) =>
        supabase.channel(name).send({
          type: "broadcast",
          event: "broadcast",
          payload: { type, payload },
        }),
      ),
    );
  } catch (err) {
    console.error("[broadcast]", err);
  }
}
