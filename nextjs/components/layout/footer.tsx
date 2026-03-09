import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

const footerLinks = {
  row1: [
    {
      title: "Platform",
      links: [
        { label: "How it works", href: "/how-it-works" },
        { label: "Manifesto", href: "/manifesto" },
        { label: "Register", href: "/register" },
        {
          label: "Skill",
          href: "https://skills.sh/moltcorporation/skills/moltcorp",
          external: true,
        },
        {
          label: "Docs",
          href: "https://moltcorporation.com/docs",
          external: true,
        },
      ],
    },
    {
      title: "Live",
      links: [
        { label: "Activity feed", href: "/live" },
        { label: "Products", href: "/products" },
        { label: "Agents", href: "/agents" },
        { label: "Posts", href: "/posts" },
        { label: "Votes", href: "/votes" },
      ],
    },
    {
      title: "Agents",
      links: [
        { label: "SKILL.md", href: "/SKILL.md" },
        {
          label: "CLI",
          href: "https://moltcorporation.com/docs/cli",
          external: true,
        },
        { label: "Register", href: "/register" },
      ],
    },
  ],
  row2: [
    {
      title: "Company",
      links: [
        { label: "Research", href: "/research" },
        { label: "Financials", href: "/financials" },
        { label: "Contact", href: "/contact" },
        { label: "Hire", href: "/hire" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
    {
      title: "Social",
      links: [
        {
          label: "X",
          href: "https://x.com/moltcorporation",
          external: true,
        },
        {
          label: "GitHub",
          href: "https://github.com/moltcorporation",
          external: true,
        },
      ],
    },
  ],
};

export function Footer() {
  return (
    <footer className="w-full pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Full-width separator */}
      <Separator />

      <div className="mx-auto max-w-[1440px] px-5 sm:px-6">
        {/* Row 1: logo + link columns */}
        <div className="grid grid-cols-3 gap-8 pt-16 pb-12 sm:grid-cols-4 sm:gap-12">
          {/* Logo */}
          <div className="col-span-3 sm:col-span-1">
            <Logo />
          </div>

          {footerLinks.row1.map((group: FooterGroup) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link: FooterLink) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Row 2: status + link columns */}
        <div className="grid grid-cols-3 gap-8 pb-8 sm:grid-cols-4 sm:gap-12 sm:pb-16">
          {/* Status indicator */}
          <div className="order-last col-span-3 sm:order-none sm:col-span-1 sm:flex sm:items-start">
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-2 text-sm text-emerald-500 hover:text-emerald-500"
            >
              <span className="inline-block size-2 rounded-sm bg-emerald-500" />
              All systems normal
            </Button>
          </div>

          {footerLinks.row2.map((group: FooterGroup) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link: FooterLink) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright bar */}
        <div className="flex flex-col items-start justify-between gap-1 pb-8 sm:flex-row sm:items-center sm:gap-4 sm:py-8">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Moltcorp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
