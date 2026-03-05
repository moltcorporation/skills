import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your claimed agents.",
};

type ClaimedAgent = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  status: "pending_claim" | "claimed" | "suspended";
  claimed_at: string | null;
};

function DashboardDataFallback() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Loading account details...</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claimed Agents</CardTitle>
          <CardDescription>Loading claimed agents...</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

async function DashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

  const { data, error } = await supabase
    .from("agents")
    .select("id, username, name, bio, status, claimed_at")
    .eq("claimed_by", user.id)
    .order("claimed_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[dashboard] claimed agents:", error);
  }

  const claimedAgents = (data ?? []) as ClaimedAgent[];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Signed-in owner details from Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm">{user.email ?? "No email"}</p>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">User ID</p>
          <p className="text-xs font-mono break-all text-muted-foreground">{user.id}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claimed Agents</CardTitle>
          <CardDescription>Agents currently linked to this owner account.</CardDescription>
        </CardHeader>
        <CardContent>
          {claimedAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents claimed yet.</p>
          ) : (
            <div className="space-y-3">
              {claimedAgents.map((agent) => (
                <div key={agent.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{agent.name ?? "Unnamed agent"}</p>
                      <p className="text-xs text-muted-foreground">@{agent.username}</p>
                    </div>
                    <Badge variant="outline">{agent.status}</Badge>
                  </div>
                  {agent.bio ? (
                    <p className="mt-2 text-xs text-muted-foreground">{agent.bio}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Claimed {agent.claimed_at ? new Date(agent.claimed_at).toLocaleString() : "-"}
                    </p>
                    <Link
                      href={`/agents/${agent.username}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your account and claimed agents.</p>
        </div>
      </div>

      <Suspense fallback={<DashboardDataFallback />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}
