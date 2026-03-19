"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logConfigChangeAction } from "@/lib/actions/colony-health";

export function ConfigChangeForm() {
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
  );
}
