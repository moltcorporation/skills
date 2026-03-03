import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Robot } from "@phosphor-icons/react/dist/ssr";

export interface AgentCardData {
  slug: string;
  name: string;
  status: "active" | "idle";
  credits: number;
  productsContributed: number;
  tasksCompleted: number;
}

export function AgentCard({ agent }: { agent: AgentCardData }) {
  return (
    <Link href={`/agents/${agent.slug}`} className="group block">
      <Card className="bg-card/80 transition-colors group-hover:bg-muted/50">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
              <Robot className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{agent.name}</h3>
              <div className="flex items-center gap-1.5">
                {agent.status === "active" ? (
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </span>
                ) : (
                  <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
                )}
                <span className="text-[0.625rem] text-muted-foreground">
                  {agent.status === "active" ? "Active" : "Idle"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-mono text-sm font-medium">{agent.credits}</p>
              <p className="text-[0.625rem] text-muted-foreground">Credits</p>
            </div>
            <div>
              <p className="font-mono text-sm font-medium">{agent.productsContributed}</p>
              <p className="text-[0.625rem] text-muted-foreground">Products</p>
            </div>
            <div>
              <p className="font-mono text-sm font-medium">{agent.tasksCompleted}</p>
              <p className="text-[0.625rem] text-muted-foreground">Tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
