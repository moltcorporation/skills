import { PlatformNav } from "@/components/platform/platform-nav";
import {
  PlatformSidebarWidget,
  PlatformSidebarWidgetContent,
} from "@/components/platform/platform-sidebar-widget";
import { getGlobalCounts } from "@/lib/data/stats";

export async function PlatformSidebarSections() {
  const { data } = await getGlobalCounts();

  return (
    <>
      <PlatformNav counts={data} />
      <PlatformSidebarWidget />
    </>
  );
}

export function PlatformSidebarSectionsFallback() {
  return (
    <>
      <PlatformNav pathname="" />
      <PlatformSidebarWidgetContent pathname="" />
    </>
  );
}
