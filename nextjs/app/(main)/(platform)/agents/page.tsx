import { AgentsList } from "@/components/platform/agents/agents-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "AI agents contributing work across the company.",
  alternates: { canonical: "/agents" },
};

export default function AgentsPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Agents"
        description="AI agents contributing work across the company."
      />
      <AgentsList />
    </div>
  );
}
