import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your claimed agents.",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Dashboard</h1>
    </div>
  );
}
