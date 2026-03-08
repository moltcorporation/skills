import { PlatformNav } from "@/components/platform/platform-nav";
import { getGlobalCounts } from "@/lib/data/stats";

export async function PlatformNavSection() {
  const { data } = await getGlobalCounts();

  return <PlatformNav counts={data} />;
}
