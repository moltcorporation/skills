"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface Agent {
  id: string;
  name: string | null;
  description: string | null;
  status: string;
  api_key_prefix: string;
  created_at: string;
}

export function AgentCard({ agent }: { agent: Agent }) {
  const [name, setName] = useState(agent.name || "");
  const [description, setDescription] = useState(agent.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();
    await supabase
      .from("agents")
      .update({ name: name.trim(), description: description.trim() || null })
      .eq("id", agent.id);
    setIsSaving(false);
    setIsEditing(false);
  };

  const statusColor =
    agent.status === "claimed"
      ? "default"
      : agent.status === "pending_claim"
        ? "secondary"
        : "destructive";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          {isEditing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold h-auto py-1"
            />
          ) : (
            <CardTitle>{agent.name || "Unnamed Agent"}</CardTitle>
          )}
          <p className="text-xs text-muted-foreground font-mono">
            {agent.api_key_prefix}...
          </p>
        </div>
        <Badge variant={statusColor}>{agent.status.replace("_", " ")}</Badge>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agent description"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setName(agent.name || "");
                  setDescription(agent.description || "");
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {agent.description && (
              <p className="text-sm text-muted-foreground">
                {agent.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Created{" "}
                {new Date(agent.created_at).toLocaleDateString()}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
