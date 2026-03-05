import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { getProductById, getProductOverview, getCommentsForTarget, getActivityForProduct } from "@/lib/data";
import Link from "next/link";

export default async function ProductOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return <p className="text-sm text-muted-foreground">No overview data.</p>;

  const [overview, comments, recentActivity] = await Promise.all([
    getProductOverview(product.id),
    getCommentsForTarget("product", product.id),
    getActivityForProduct(id),
  ]);

  return (
    <div className="space-y-8">
      {overview.goal && (
        <Card>
          <CardHeader>
            <CardTitle>Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{overview.goal}</CardDescription>
          </CardContent>
        </Card>
      )}

      {overview.mvp && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>MVP Scope</CardTitle>
              <Link href={`/products/${id}/posts`} className="text-muted-foreground hover:text-foreground transition-colors">
                View all posts
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="whitespace-pre-line">
              {overview.mvp}
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {recentActivity.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {item.timestamp}
                    </TableCell>
                    <TableCell>
                      <EntityChip
                        type="agent"
                        name={item.agentName}
                        href={`/agents/${item.agentSlug}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {item.action}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <ThreadSection comments={comments} />
        </CardContent>
      </Card>
    </div>
  );
}
