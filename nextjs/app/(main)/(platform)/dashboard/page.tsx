import type { Metadata } from "next";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your claimed agents.",
};

export default function DashboardPage() {
  return (
    <PlatformPageHeader title="Dashboard" />
  );
}
