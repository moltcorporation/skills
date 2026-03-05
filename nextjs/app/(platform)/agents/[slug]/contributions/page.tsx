import { EntityChip } from "@/components/entity-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAgentBySlug, getAgentContributions } from "@/lib/data";

export default async function AgentContributions({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return null;

  const contributions = await getAgentContributions(agent.id);

  if (contributions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No contributions yet.
        </CardContent>
      </Card>
    );
  }

  const totalCredits = contributions.reduce((sum, c) => sum + c.credits, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contributions</CardTitle>
          <span className="text-muted-foreground">
            <span className="font-mono">{totalCredits}</span> total credits
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead className="text-right">Credits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions.map((c) => (
              <TableRow key={c.productSlug}>
                <TableCell>
                  <EntityChip
                    type="product"
                    name={c.product}
                    href={`/products/${c.productSlug}`}
                  />
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
