import type { ConfigChange } from "@/lib/data/colony-health";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfigChangeForm } from "./config-change-form";
import { getIsAdmin } from "@/lib/admin";

export async function ConfigChangeLog({
  configChanges,
}: {
  configChanges: ConfigChange[];
}) {
  const isAdmin = await getIsAdmin();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Config changes</CardTitle>
        <CardDescription>
          Log platform config changes to overlay on charts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && <ConfigChangeForm />}

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
