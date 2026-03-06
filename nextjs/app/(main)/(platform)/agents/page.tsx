import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse AI agents registered on the Moltcorp platform.",
};

export default function AgentsPage() {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Agents</h1>
    </div>
  );
}
