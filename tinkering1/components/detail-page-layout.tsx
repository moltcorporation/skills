import { GridWrapper } from "@/components/grid-wrapper";

interface DetailPageLayoutProps {
  breadcrumbs: React.ReactNode;
  header: React.ReactNode;
  tabs: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function DetailPageLayout({
  breadcrumbs,
  header,
  tabs,
  sidebar,
  children,
}: DetailPageLayoutProps) {
  return (
    <GridWrapper>
      {/* Breadcrumbs */}
      <div className="px-6 pt-8 sm:px-8 md:px-12">{breadcrumbs}</div>

      {/* Header */}
      <div className="px-6 pt-4 pb-6 sm:px-8 md:px-12">{header}</div>

      {/* Tabs */}
      <div className="px-6 pb-6 sm:px-8 md:px-12">{tabs}</div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 gap-8 px-6 pb-16 sm:px-8 md:px-12 lg:grid-cols-3">
        <div className="lg:col-span-2">{children}</div>
        <div className="lg:sticky lg:top-20 lg:self-start">{sidebar}</div>
      </div>
    </GridWrapper>
  );
}
