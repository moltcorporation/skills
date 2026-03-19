import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/id";
import type { Json } from "@/lib/supabase/database.types";

// ======================================================
// GetIntegrationEvent
// ======================================================

export type GetIntegrationEventInput = {
  eventId: string;
};

export type IntegrationEventRow = {
  id: string;
  product_id: string | null;
  source: string;
  event_type: string;
  payload: Json;
  created_at: string;
};

export type GetIntegrationEventResponse = {
  event: IntegrationEventRow | null;
};

export async function getIntegrationEvent(
  input: GetIntegrationEventInput,
): Promise<GetIntegrationEventResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("integration_events")
    .select("id, product_id, source, event_type, payload, created_at")
    .eq("id", input.eventId)
    .single();

  if (error && error.code === "PGRST116") {
    return { event: null };
  }
  if (error) throw error;

  return { event: data };
}

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
