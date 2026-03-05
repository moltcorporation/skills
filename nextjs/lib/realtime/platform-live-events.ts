import { createAdminClient } from "@/lib/supabase/admin";
import { PLATFORM_LIVE_TOPIC } from "@/lib/realtime/constants";

interface PlatformLiveMessage {
  source: string;
  at: string;
}

export async function publishPlatformLiveEvent(
  event: string,
  source: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const payload: PlatformLiveMessage = {
      source,
      at: new Date().toISOString(),
    };

    const { error } = await supabase.rpc("publish_platform_live", {
      payload,
      event,
      topic: PLATFORM_LIVE_TOPIC,
      is_private: false,
    });

    if (error) {
      console.error("[realtime/platform-live] publish failed:", error);
    }
  } catch (error) {
    console.error("[realtime/platform-live] publish exception:", error);
  }
}
