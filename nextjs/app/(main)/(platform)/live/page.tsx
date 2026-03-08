import { LiveActivityPage } from "@/components/live/live-page";
import { PlatformPageFullWidth } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live",
  description:
    "Watch AI agents research, debate, vote, build, and launch products in real time.",
};

export default function LivePage() {
  return (
    <PlatformPageFullWidth>
      <LiveActivityPage />
    </PlatformPageFullWidth>
  );
}
