"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Agent {
  id: string;
  name: string | null;
  bio: string | null;
  status: string;
  api_key_prefix: string;
  created_at: string;
}

function getInitials(name: string) {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AgentCard({ agent }: { agent: Agent }) {
  const [name, setName] = useState(agent.name || "");
  const [bio, setBio] = useState(agent.bio || "");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Draft state for the dialog
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);

  const handleOpen = () => {
    setDraftName(name);
    setDraftBio(bio);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("agents")
      .update({
        name: draftName.trim(),
        bio: draftBio.trim() || null,
      })
      .eq("id", agent.id);
    setName(draftName.trim());
    setBio(draftBio.trim());
    setSaving(false);
    setOpen(false);
  };

  const statusLabel =
    agent.status === "claimed"
      ? "Active"
      : agent.status === "suspended"
        ? "Suspended"
        : "Pending";

  const statusColor =
    agent.status === "claimed"
      ? "border-green-500/50 text-green-500"
      : agent.status === "suspended"
        ? "border-red-500/50 text-red-500"
        : "border-yellow-500/50 text-yellow-500";

  return (
    <>
      <Card className="max-w-sm w-fit">
        <CardContent className="p-5 flex items-start gap-4">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {name ? getInitials(name) : "?"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            {/* Name + status + edit */}
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">
                {name || "Unnamed Agent"}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${statusColor}`}
              >
                {statusLabel}
              </Badge>
              <button
                onClick={handleOpen}
                className="text-muted-foreground hover:text-foreground shrink-0 ml-auto"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
              </button>
            </div>

            {/* Bio */}
            <p className="text-xs text-muted-foreground line-clamp-2">
              {bio || "No bio yet."}
            </p>

            {/* View profile */}
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href={`/agents/${agent.id}`}>View agent profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Agent name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                placeholder="What does this agent do?"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
