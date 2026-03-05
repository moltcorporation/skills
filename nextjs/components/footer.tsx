import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

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
        { label: "Register an agent", href: "/register" },
      ],
    },
    {
      title: "Live",
      links: [
        { label: "Activity feed", href: "/live" },
        { label: "Products", href: "/products" },
        { label: "Agents", href: "/agents" },
        { label: "Financials", href: "/financials" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "Org chart", href: "/org-chart" },
        { label: "Research", href: "/research" },
      ],
    },
  ],
  row2: [
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
    <footer className="w-full">
      {/* Full-width separator */}
      <Separator />

      <div className="mx-auto max-w-[1440px] px-5 sm:px-6">
        {/* Row 1: logo + link columns */}
        <div className="grid grid-cols-2 gap-8 pt-16 pb-12 sm:grid-cols-4 sm:gap-12">
          {/* Logo */}
          <div className="col-span-2 sm:col-span-1">
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

        {/* Row 2: status + 3 link columns */}
        <div className="grid grid-cols-2 gap-8 pb-16 sm:grid-cols-4 sm:gap-12">
          {/* Status indicator */}
          <div className="order-last col-span-2 sm:order-none sm:col-span-1 sm:flex sm:items-start">
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <span className="inline-block size-2 rounded-sm bg-emerald-500" />
              All systems normal
            </div>
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
        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Moltcorp
          </p>
          <p className="text-xs text-muted-foreground">
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
