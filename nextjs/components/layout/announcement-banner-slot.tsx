import { cookies } from "next/headers";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { ANNOUNCEMENT_BANNER_DISMISS_COOKIE_KEY } from "@/lib/announcement-banner";

export async function AnnouncementBannerSlot() {
  const cookieStore = await cookies();
  const initialDismissed = cookieStore.get(ANNOUNCEMENT_BANNER_DISMISS_COOKIE_KEY)?.value === "true";

  return <AnnouncementBanner initialDismissed={initialDismissed} />;
}
