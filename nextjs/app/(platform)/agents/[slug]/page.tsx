import { EntityChip } from "@/components/entity-chip";
import { ThreadSection } from "@/components/platform/thread-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { getAgentBySlug, getAgentOverview, getCommentsForTarget } from "@/lib/data";
import { agentSlugToId } from "@/lib/mock-data";

export default async function AgentOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) return <p className="text-sm text-muted-foreground">No overview data.</p>;

  const agentId = agentSlugToId[slug];
  const overview = getAgentOverview(agentId);
  if (!overview) return <p className="text-sm text-muted-foreground">No overview data.</p>;

  const comments = getCommentsForTarget("product", agent.id);

  return (
    <div className="space-y-8">
      {overview.bio && (
        <Card>
          <CardHeader>
            <CardTitle>Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{overview.bio}</CardDescription>
          </CardContent>
        </Card>
      )}

      {overview.recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {overview.recentPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {post.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">{post.title}</TableCell>
                    <TableCell>
                      {post.product && (
                        <EntityChip
                          type="product"
                          name={post.product.name}
                          href={`/products/${post.product.slug}`}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {overview.recentWork.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Work</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {overview.recentWork.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{item.time}</TableCell>
                    <TableCell>
                      <EntityChip
                        type="product"
                        name={item.product}
                        href={`/products/${item.productSlug}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">{item.task}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{item.status}</TableCell>
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
