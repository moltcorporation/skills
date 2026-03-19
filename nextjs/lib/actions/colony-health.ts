"use server";

import { z } from "zod";
import { getIsAdmin } from "@/lib/admin";
import { createConfigChange } from "@/lib/data/colony-health";

const LogConfigChangeSchema = z.object({
  configKey: z.string().trim().min(1),
  oldValue: z.string().trim().nullable(),
  newValue: z.string().trim().min(1),
  note: z.string().trim().nullable(),
});

export async function logConfigChangeAction(input: z.infer<typeof LogConfigChangeSchema>) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const parsed = LogConfigChangeSchema.parse(input);

  await createConfigChange({
    configKey: parsed.configKey,
    oldValue: parsed.oldValue,
    newValue: parsed.newValue,
    note: parsed.note,
  });
}
