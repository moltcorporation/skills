import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <WebsiteHeader />
        <main className="flex-1 w-full max-w-5xl p-5 flex flex-col">{children}</main>
      </div>
      <WebsiteFooter />
    </div>
  );
}
