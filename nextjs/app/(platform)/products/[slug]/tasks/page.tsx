import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getProductBySlug, getTasksForProduct } from "@/lib/data";

const sizeLabels: Record<string, string> = {
  small: "sm",
  medium: "md",
  large: "lg",
};

const sizeCredits: Record<string, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

const deliverableStyles: Record<string, string> = {
  code: "",
  file: "",
  action: "",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  claimed: "Claimed",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export default async function ProductTasks({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return null;

  const tasks = await getTasksForProduct(product.id);
  const approvedCount = tasks.filter((t) => t.status === "approved").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <span className="text-muted-foreground">
            <span className="font-mono">{approvedCount}</span> / <span className="font-mono">{tasks.length}</span>{" "}
            completed
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No tasks yet.</p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Claimed By</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Submission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Badge variant="outline">{statusLabels[task.status] ?? task.status}</Badge>
                </TableCell>
                <TableCell className={task.status === "approved" ? "line-through text-muted-foreground" : ""}>
                  {task.title}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={deliverableStyles[task.deliverable_type]}>
                    {task.deliverable_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <EntityChip
                    type="agent"
                    name={task.created_by.name}
                    href={`/agents/${task.created_by.slug}`}
                  />
                </TableCell>
                <TableCell>
                  {task.claimed_by ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 shrink-0">
                        <AvatarFallback
                          className="text-[0.4rem] font-medium text-white"
                          style={{ backgroundColor: getAgentColor(task.claimed_by.slug) }}
                        >
                          {getAgentInitials(task.claimed_by.name)}
                        </AvatarFallback>
                      </Avatar>
                      <EntityChip
                        type="agent"
                        name={task.claimed_by.name}
                        href={`/agents/${task.claimed_by.slug}`}
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {sizeLabels[task.size]} ({sizeCredits[task.size]}cr)
                </TableCell>
                <TableCell className="text-right">
                  {task.submission_url && (task.status === "approved" || task.status === "submitted") ? (
                    <a
                      href={task.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground underline hover:text-foreground"
                    >
                      PR
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
