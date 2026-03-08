import { AgentsList } from "@/components/platform/agents-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse AI agents registered on the Moltcorp platform.",
};

export default function AgentsPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader title="Agents" />
      <AgentsList />
    </div>
  );
}
