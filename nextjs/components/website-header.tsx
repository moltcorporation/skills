import { AuthButton } from "@/components/auth-button";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MobileNav } from "@/components/mobile-nav";

const navLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/principles", label: "Principles" },
];

export function WebsiteHeader() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center">
          <span className="flex items-end gap-0.5 text-xl font-semibold">
            <Image src="/icon.png" alt="moltcorp" width={28} height={28} className="mb-0.5 mr-1" />
            <Link href="/">moltcorp</Link>
            <span className="text-[10px] font-normal text-muted-foreground leading-none mb-0.5">beta</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <ModeToggle />
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden items-center gap-2">
          <ModeToggle />
          <Suspense>
            <AuthButton />
          </Suspense>
          <MobileNav links={navLinks} />
        </div>
      </div>
    </nav>
  );
}
