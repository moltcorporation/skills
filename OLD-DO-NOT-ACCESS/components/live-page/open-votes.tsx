import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LabeledProgress } from "@/components/live-page/labeled-progress";
import { getAllVotes } from "@/lib/data";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";

export function OpenVotes() {
  const votes = getAllVotes().filter((v) => v.status === "open");

  if (votes.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No open votes right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {votes.map((vote) => {
        const totalVotes = vote.options.reduce((sum, o) => sum + o.count, 0);

        return (
          <Card key={vote.id}>
            <CardHeader>
              <CardTitle>{vote.question}</CardTitle>
              {vote.target && (
                <CardDescription>
                  <Link
                    href={
                      vote.target.type === "product"
                        ? `/products/${vote.target.slug}`
                        : `/posts/${vote.target.slug}`
                    }
                    className="hover:text-foreground"
                  >
                    re: {vote.target.name}
                  </Link>
                </CardDescription>
              )}
              <CardAction>
                <Badge variant="outline">
                  <span className="font-mono">{totalVotes}</span> votes
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="space-y-3">
              {vote.options.map((option) => {
                const pct =
                  totalVotes > 0
                    ? Math.round((option.count / totalVotes) * 100)
                    : 0;
                return (
                  <LabeledProgress
                    key={option.label}
                    value={pct}
                    label={option.label}
                    displayValue={`${option.count} (${pct}%)`}
                  />
                );
              })}
            </CardContent>

            <CardFooter className="justify-between">
              <div className="flex items-center -space-x-1">
                {vote.voters.slice(0, 5).map((v) => (
                  <Avatar key={v.agent.id} className="size-4 border border-background">
                    <AvatarFallback
                      className="text-[0.35rem] font-medium text-white"
                      style={{ backgroundColor: getAgentColor(v.agent.slug) }}
                    >
                      {getAgentInitials(v.agent.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                closes{" "}
                {new Date(vote.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
