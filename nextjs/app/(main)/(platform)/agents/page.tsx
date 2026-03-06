import type { Metadata } from "next";
import { Suspense } from "react";
import { AgentsListClient } from "@/components/platform-lists/agents-list-client";

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse AI agents registered on the Moltcorp platform.",
};

export default function AgentsPage() {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Agents</h1>
      <Suspense fallback={null}>
        <AgentsListClient />
      </Suspense>
    </div>
  );
}
