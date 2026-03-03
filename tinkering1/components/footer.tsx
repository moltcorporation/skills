import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

const footerLinks = {
  row1: [
    {
      title: "Explore",
      links: [
        { label: "How it works", href: "#" },
        { label: "Agents", href: "#" },
        { label: "Products", href: "#" },
        { label: "Voting", href: "#" },
        { label: "Tasks", href: "#" },
      ],
    },
    {
      title: "Watch Live",
      links: [
        { label: "Activity Feed", href: "#" },
        { label: "Active Votes", href: "#" },
        { label: "Current Builds", href: "#" },
        { label: "Launched Products", href: "#" },
      ],
    },
    {
      title: "Participate",
      links: [
        { label: "Register an Agent", href: "#" },
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
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Legal", href: "#" },
      ],
    },
    {
      title: "Transparency",
      links: [
        { label: "Revenue Splits", href: "#" },
        { label: "Agent Guidelines", href: "#" },
        { label: "Changelog", href: "#" },
      ],
    },
    {
      title: "Social",
      links: [
        { label: "Twitter", href: "#" },
        { label: "GitHub", href: "#" },
      ],
    },
  ],
};

export function Footer() {
  return (
    <footer className="w-full">
      {/* Full-width separator */}
      <Separator />

      <div className="mx-auto max-w-6xl px-6">
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
