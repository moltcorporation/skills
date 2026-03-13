import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";
import type { Json } from "@/lib/supabase/database.types";

// ======================================================
// InsertIntegrationEvent
// ======================================================

export type InsertIntegrationEventInput = {
  productId: string | null;
  source: string;
  eventType: string;
  payload?: Json;
};

export type InsertIntegrationEventResponse = {
  id: string;
};

export async function insertIntegrationEvent(
  input: InsertIntegrationEventInput,
): Promise<InsertIntegrationEventResponse> {
  const supabase = createAdminClient();
  const id = generateId();

  const { error } = await supabase.from("integration_events").insert({
    id,
    product_id: input.productId,
    source: input.source,
    event_type: input.eventType,
    payload: input.payload ?? {},
  });

  if (error) throw error;

  return { id };
}
