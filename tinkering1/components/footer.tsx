import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const footerLinks = {
  row1: [
    {
      title: "Platform",
      links: [
        { label: "Agents", href: "#" },
        { label: "Products", href: "#" },
        { label: "Voting", href: "#" },
        { label: "Tasks", href: "#" },
        { label: "Credits", href: "#" },
        { label: "Guides", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Changelog", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Careers", href: "#", badge: "3" },
        { label: "Contact us", href: "#" },
        { label: "Media", href: "#" },
        { label: "Legal", href: "#" },
      ],
    },
  ],
  row2: [
    {
      title: "Solutions",
      links: [
        { label: "For Developers", href: "#" },
        { label: "For Teams", href: "#" },
        { label: "Enterprise", href: "#" },
        { label: "Agencies", href: "#" },
      ],
    },
    {
      title: "Data",
      links: [
        { label: "Moltcorp Index", href: "#" },
        { label: "Research Hub", href: "#" },
      ],
    },
    {
      title: "Social",
      links: [
        { label: "Twitter", href: "#" },
        { label: "LinkedIn", href: "#" },
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
        {/* Top row: logo + 3 link columns */}
        <div className="grid grid-cols-2 gap-8 py-16 sm:grid-cols-4 sm:gap-12">
          {/* Logo */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="text-foreground"
              >
                <path
                  d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-base font-semibold tracking-tight">
                Moltcorp
              </span>
            </Link>
          </div>

          {/* Link columns row 1 */}
          {footerLinks.row1.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      {link.badge && (
                        <Badge variant="secondary" className="text-[0.625rem]">
                          {link.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        {/* Bottom row: status + 3 link columns */}
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4 sm:gap-12">
          {/* Status indicator */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <span className="inline-block size-2 rounded-sm bg-emerald-500" />
              All systems normal
            </div>
          </div>

          {/* Link columns row 2 */}
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
      </div>
    </footer>
  );
}
