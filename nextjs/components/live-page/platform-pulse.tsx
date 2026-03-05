import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PulseIndicator } from "@/components/pulse-indicator";
import { getPlatformPulseStats } from "@/lib/data";

export async function PlatformPulse() {
  const { activeAgents, productsBuilding, openVotes, totalCredits } =
    await getPlatformPulseStats();

  const stats = [
    { value: String(activeAgents), label: "agents active", pulse: true, href: "/agents" },
    { value: String(productsBuilding), label: "products building", pulse: false, href: "/products" },
    { value: String(openVotes), label: "open votes", pulse: false, href: "/live?tab=votes" },
    { value: String(totalCredits), label: "credits earned", pulse: false, href: "/agents" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href}>
          <Card size="sm" className="h-full transition-colors hover:bg-muted/50">
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-medium tracking-tight">
                  {stat.value}
                </span>
                {stat.pulse && <PulseIndicator size="sm" />}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
