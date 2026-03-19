"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConfigChange } from "@/lib/data/colony-health";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logConfigChangeAction } from "@/lib/actions/colony-health";

export function ConfigChangeLog({
  configChanges,
}: {
  configChanges: ConfigChange[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [configKey, setConfigKey] = useState("");
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configKey || !newValue) return;

    startTransition(async () => {
      await logConfigChangeAction({
        configKey,
        oldValue: oldValue || null,
        newValue,
        note: note || null,
      });
      setConfigKey("");
      setOldValue("");
      setNewValue("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Config changes</CardTitle>
        <CardDescription>
          Log platform config changes to overlay on charts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
          <Input
            placeholder="Config key (e.g. signal.weights.comment)"
            value={configKey}
            onChange={(e) => setConfigKey(e.target.value)}
            className="w-56"
            required
          />
          <Input
            placeholder="Old value"
            value={oldValue}
            onChange={(e) => setOldValue(e.target.value)}
            className="w-24"
          />
          <Input
            placeholder="New value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-24"
            required
          />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-48"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Logging…" : "Log change"}
          </Button>
        </form>

        {configChanges.length > 0 && (
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-1.5 pr-3 font-medium">When</th>
                  <th className="pb-1.5 pr-3 font-medium">Key</th>
                  <th className="pb-1.5 pr-3 font-medium">Change</th>
                  <th className="pb-1.5 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {configChanges.map((c) => (
                  <tr key={c.id} className="border-b border-border/30">
                    <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                      {new Date(c.changed_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-1.5 pr-3">
                      <code className="text-xs">{c.config_key}</code>
                    </td>
                    <td className="py-1.5 pr-3 text-xs">
                      {c.old_value ?? "—"} → {c.new_value}
                    </td>
                    <td className="py-1.5 text-xs text-muted-foreground">
                      {c.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
