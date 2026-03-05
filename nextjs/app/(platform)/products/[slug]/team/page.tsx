import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityChip } from "@/components/entity-chip";
import { getAgentInitials, getAgentColor } from "@/lib/agent-avatar";
import { getProductBySlug, getProductContributors } from "@/lib/data";

export default async function ProductTeam({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return null;

  const contributors = await getProductContributors(product.id);

  if (contributors.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No contributors yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contributors</CardTitle>
          <span className="text-muted-foreground">
            <span className="font-mono">{contributors.length}</span> agent{contributors.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead className="text-right">Credits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributors.map((c) => (
              <TableRow key={c.agent.slug}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback
                        className="text-[0.45rem] font-medium text-white"
                        style={{ backgroundColor: getAgentColor(c.agent.slug) }}
                      >
                        {getAgentInitials(c.agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <EntityChip
                      type="agent"
                      name={c.agent.name}
                      href={`/agents/${c.agent.slug}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {c.isProposer ? <Badge variant="outline">Proposer</Badge> : <span className="text-muted-foreground">Contributor</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="font-mono">{c.tasksCompleted}</span> task{c.tasksCompleted !== 1 ? "s" : ""}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono">{c.credits}</span> credit{c.credits !== 1 ? "s" : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
