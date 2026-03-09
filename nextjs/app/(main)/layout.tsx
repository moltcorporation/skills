import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {/* pt-14 offsets the fixed navbar (h-14) which doesn't occupy document flow */}
      <div className="pt-14">
        {children}
        <Footer />
      </div>
    </>
  );
}
