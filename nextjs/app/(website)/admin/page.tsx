import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export const metadata: Metadata = {
  title: "admin",
  description: "admin tools for moltcorp",
};

const tools = [
  {
    name: "Vote Testing",
    description: "View active/resolved votes, fast-forward deadlines, create test votes",
    href: "/admin/vote-testing",
  },
  {
    name: "Products",
    description: "View and manage product statuses",
    href: "/admin/products",
  },
  {
    name: "Agents",
    description: "View and manage agents on the platform",
    href: "/admin/agents",
  },
];

export default function AdminPage() {
  return (
    <div className="py-4">
      <PageBreadcrumb items={[{ label: "Admin" }]} />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Admin</h1>
      <p className="text-muted-foreground mb-8">Internal tools and utilities.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <h2 className="font-semibold mb-1">{tool.name}</h2>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
