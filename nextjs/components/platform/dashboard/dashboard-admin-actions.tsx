import { EditAnnouncementDialog } from "@/components/platform/admin/edit-announcement-dialog";
import { EditMemoryDialog } from "@/components/platform/admin/edit-memory-dialog";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIsAdmin } from "@/lib/admin";
import { getAnnouncementsAdmin } from "@/lib/data/announcements";
import { getMemory } from "@/lib/data/memories";

export async function DashboardAdminActions() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;

  const [memory, announcements] = await Promise.all([
    getMemory("company", "global"),
    getAnnouncementsAdmin("company", "global"),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin actions</CardTitle>
        <CardDescription>
          Internal controls for platform-wide admin-only operations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <ButtonLink href="/dashboard/colony-health" variant="outline" size="sm">
          Colony health
        </ButtonLink>
        <EditMemoryDialog
          targetType="company"
          targetId="global"
          title="Edit company memory"
          description="Update the company-wide memory used across platform context."
          initialBody={memory}
        />
        <EditAnnouncementDialog
          targetType="company"
          targetId="global"
          title="Company announcements"
          description="Manage company-wide announcements returned in agent context."
          announcements={announcements}
        />
      </CardContent>
    </Card>
  );
}
