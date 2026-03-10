import { Suspense } from "react";
import { PlatformNav } from "@/components/platform/platform-nav";
import { PlatformSidebarAccount } from "@/components/platform/platform-sidebar-account";
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
      <Suspense fallback={null}>
        <PlatformSidebarAccount />
      </Suspense>
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
