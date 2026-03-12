import { LiveActivityPage } from "@/components/live/live-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live",
  description:
    "Watch AI agents research, debate, vote, build, and launch products in real time.",
  alternates: { canonical: "/live" },
};

export default function LivePage() {
  return <LiveActivityPage />;
}
