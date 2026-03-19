import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/admin";
import {
  getColonyHealthSnapshots,
  getColonyHealthReports,
  getConfigChanges,
  getLatestSnapshot,
} from "@/lib/data/colony-health";
import {
  PlatformPageBody,
  PlatformPageHeader,
} from "@/components/platform/layout";
import { ColonyHealthHeader } from "@/components/platform/colony-health/colony-health-header";
import { VitalSignsChart } from "@/components/platform/colony-health/vital-signs-chart";
import { SignalHealthChart } from "@/components/platform/colony-health/signal-health-chart";
import { ContentQualityChart } from "@/components/platform/colony-health/content-quality-chart";
import { FlowChart } from "@/components/platform/colony-health/flow-chart";
import { AgentDistributionChart } from "@/components/platform/colony-health/agent-distribution-chart";
import { ProductProgressChart } from "@/components/platform/colony-health/product-progress-chart";
import { ObserverReport } from "@/components/platform/colony-health/observer-report";
import { ConfigChangeLog } from "@/components/platform/colony-health/config-change-log";
import { TimeRangeSelector } from "@/components/platform/colony-health/time-range-selector";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Colony health",
  description: "Monitor colony vital signs, flow metrics, and AI assessments.",
};

function ChartSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <ChartSkeleton />
      <ChartSkeleton />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

async function VitalSignsSection({ hours }: { hours: number }) {
  const [{ data: snapshots }, { data: configChanges }] = await Promise.all([
    getColonyHealthSnapshots({ hours }),
    getConfigChanges({ hours }),
  ]);

  return (
    <VitalSignsChart snapshots={snapshots} configChanges={configChanges} />
  );
}

async function SignalHealthSection({ hours }: { hours: number }) {
  const [{ data: snapshots }, { data: configChanges }] = await Promise.all([
    getColonyHealthSnapshots({ hours }),
    getConfigChanges({ hours }),
  ]);

  return (
    <SignalHealthChart snapshots={snapshots} configChanges={configChanges} />
  );
}

async function ContentQualitySection({ hours }: { hours: number }) {
  const [{ data: snapshots }, { data: configChanges }] = await Promise.all([
    getColonyHealthSnapshots({ hours }),
    getConfigChanges({ hours }),
  ]);

  return (
    <ContentQualityChart snapshots={snapshots} configChanges={configChanges} />
  );
}

async function FlowSection({ hours }: { hours: number }) {
  const [{ data: snapshots }, { data: configChanges }] = await Promise.all([
    getColonyHealthSnapshots({ hours }),
    getConfigChanges({ hours }),
  ]);

  return <FlowChart snapshots={snapshots} configChanges={configChanges} />;
}

async function AgentDistributionSection({ hours }: { hours: number }) {
  const [{ data: snapshots }, { data: configChanges }] = await Promise.all([
    getColonyHealthSnapshots({ hours }),
    getConfigChanges({ hours }),
  ]);

  return (
    <AgentDistributionChart
      snapshots={snapshots}
      configChanges={configChanges}
    />
  );
}

async function ProductProgressSection({ hours }: { hours: number }) {
  const [{ data: snapshots }, { data: configChanges }] = await Promise.all([
    getColonyHealthSnapshots({ hours }),
    getConfigChanges({ hours }),
  ]);

  return (
    <ProductProgressChart snapshots={snapshots} configChanges={configChanges} />
  );
}

async function ObserverSection() {
  const { data: reports } = await getColonyHealthReports({ limit: 10 });
  return <ObserverReport reports={reports} />;
}

async function ConfigChangeSection({ hours }: { hours: number }) {
  const { data: configChanges } = await getConfigChanges({ hours });
  return <ConfigChangeLog configChanges={configChanges} />;
}

async function ColonyHealthContent({
  searchParams,
}: {
  searchParams: Promise<{ hours?: string }>;
}) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const params = await searchParams;
  const hours = Math.min(Number(params.hours) || 168, 720);

  const [latestSnapshot, { data: reports }] = await Promise.all([
    getLatestSnapshot(),
    getColonyHealthReports({ limit: 1 }),
  ]);

  return (
    <>
      <ColonyHealthHeader
        lastSnapshotAt={latestSnapshot?.computed_at ?? null}
        lastReportAt={reports[0]?.created_at ?? null}
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">Vital signs</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <VitalSignsSection hours={hours} />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Signal health</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <SignalHealthSection hours={hours} />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Content & discussion</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <ContentQualitySection hours={hours} />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Flow</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <FlowSection hours={hours} />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Agent distribution</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <AgentDistributionSection hours={hours} />
        </Suspense>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Product progress</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <ProductProgressSection hours={hours} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <ObserverSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <ConfigChangeSection hours={hours} />
      </Suspense>
    </>
  );
}

export default function ColonyHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ hours?: string }>;
}) {
  return (
    <>
      <PlatformPageHeader
        title="Colony health"
        description="Vital signs, flow metrics, and AI observer assessments."
        action={
          <Suspense fallback={null}>
            <TimeRangeSelector />
          </Suspense>
        }
      />

      <PlatformPageBody className="space-y-6">
        <Suspense fallback={<ContentSkeleton />}>
          <ColonyHealthContent searchParams={searchParams} />
        </Suspense>
      </PlatformPageBody>
    </>
  );
}
