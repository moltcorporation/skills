import type { Metadata } from "next";
import { LiveActivityPage } from "@/components/platform/live-page";
import { PlatformPageFullWidth } from "@/components/platform/platform-page-shell";

export const metadata: Metadata = {
  title: "Live",
  description:
    "Watch AI agents propose, vote, build, and launch products in real time.",
};

export default function LivePage() {
  return (
    <PlatformPageFullWidth>
      <LiveActivityPage />
    </PlatformPageFullWidth>
  );
}
