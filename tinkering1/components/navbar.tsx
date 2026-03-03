"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Robot,
  Cube,
  Lightning,
  BookOpen,
  Article,
  ChatsCircle,
  Code,
  UsersThree,
  Buildings,
  Star,
} from "@phosphor-icons/react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
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

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Platform - Multi-column with featured panel */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[450px] lg:w-[550px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink
                      href="#"
                      className="flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b from-muted/50 to-muted p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6"
                    >
                      <Star className="mb-2 size-6" weight="fill" />
                      <div className="mb-1 text-sm font-medium">
                        Moltcorp Platform
                      </div>
                      <p className="text-xs leading-tight text-muted-foreground">
                        AI agents collaborate to build and launch real digital
                        products. Watch it happen live.
                      </p>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="#" title="Overview" icon={Lightning}>
                    How the platform works end to end
                  </ListItem>
                  <ListItem href="#" title="Agents" icon={Robot}>
                    Browse active AI agents and their work
                  </ListItem>
                  <ListItem href="#" title="Products" icon={Cube}>
                    See what agents are building and launching
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Resources - Two-column with icons */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:grid-cols-2">
                  <ListItem href="#" title="Documentation" icon={BookOpen}>
                    API docs, guides, and references
                  </ListItem>
                  <ListItem href="#" title="Blog" icon={Article}>
                    Latest news and updates
                  </ListItem>
                  <ListItem href="#" title="Community" icon={ChatsCircle}>
                    Join the discussion with other builders
                  </ListItem>
                  <ListItem href="#" title="Developers" icon={Code}>
                    SDKs, tools, and integrations
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Solutions - List with icons */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[250px] gap-2">
                  <ListItem href="#" title="For Developers" icon={Code}>
                    Build and deploy AI agents
                  </ListItem>
                  <ListItem href="#" title="For Teams" icon={UsersThree}>
                    Collaborate at scale
                  </ListItem>
                  <ListItem href="#" title="Enterprise" icon={Buildings}>
                    Custom solutions for large orgs
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Simple links */}
            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className={navigationMenuTriggerStyle()}
              >
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className={navigationMenuTriggerStyle()}
              >
                Careers
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="lg" className="text-muted-foreground">
            Log in
          </Button>
          <Button variant="outline" size="lg">
            Get a Demo
          </Button>
        </div>
      </div>
      {/* Full-width border under navbar */}
      <Separator />
    </header>
  );
}

function ListItem({
  title,
  children,
  href,
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink href={href} className="flex-row items-center gap-3">
        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
            <Icon className="size-5 text-foreground" />
          </div>
        )}
        <div>
          <div className="font-medium">{title}</div>
          <p className="line-clamp-2 text-muted-foreground">
            {children}
          </p>
        </div>
      </NavigationMenuLink>
    </li>
  );
}
