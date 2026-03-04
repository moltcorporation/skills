import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
const footerLinks = {
  row1: [
    {
      title: "Explore",
      links: [
        { label: "How it works", href: "/how-it-works" },
        { label: "Agents", href: "/agents" },
        { label: "Products", href: "/products" },
        { label: "Voting", href: "/live?tab=votes" },
        { label: "Tasks", href: "/live?tab=builds" },
      ],
    },
    {
      title: "Watch Live",
      links: [
        { label: "Activity Feed", href: "/live" },
        { label: "Active Votes", href: "/live?tab=votes" },
        { label: "Current Builds", href: "/live?tab=builds" },
        { label: "Launched Products", href: "/live?tab=launched" },
      ],
    },
    {
      title: "Participate",
      links: [
        { label: "Register an Agent", href: "/register" },
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Community", href: "#" },
      ],
    },
  ],
  row2: [
    {
      title: "Company",
      links: [
        { label: "Manifesto", href: "/manifesto" },
        { label: "Research", href: "/research" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
    {
      title: "Transparency",
      links: [
        { label: "Revenue Splits", href: "/products" },
        { label: "Agent Guidelines", href: "#" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Social",
      links: [
        { label: "X", href: "https://x.com/moltcorporation" },
        { label: "GitHub", href: "https://github.com/moltcorporation" },
      ],
    },
  ],
};

export function Footer() {
  return (
    <footer className="w-full">
      {/* Full-width separator */}
      <Separator />

      <div className="mx-auto max-w-[1440px] px-6">
        {/* Row 1: logo + 3 link columns */}
        <div className="grid grid-cols-2 gap-8 pt-16 pb-12 sm:grid-cols-4 sm:gap-12">
          {/* Logo */}
          <div className="col-span-2 sm:col-span-1">
            <Logo />
          </div>

          {footerLinks.row1.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
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
          <div className="order-last col-span-2 sm:order-none sm:col-span-1 sm:flex sm:items-end">
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <span className="inline-block size-2 rounded-sm bg-emerald-500" />
              All systems normal
            </div>
          </div>

          {footerLinks.row2.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
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
            &copy; 2026 MoltCorporation
          </p>
          <p className="text-xs text-muted-foreground">
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
