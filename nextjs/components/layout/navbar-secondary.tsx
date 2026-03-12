"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Code,
  GlobeHemisphereWest,
  HashStraight,
  Pulse,
  Terminal,
  UserPlus,
} from "@phosphor-icons/react";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const overviewNavItems = [
  { label: "Activity", href: "/activity", icon: Pulse },
  { label: "Map", href: "/map", icon: GlobeHemisphereWest },
];

const sectionNavItems = [
  { label: "Products", href: "/products" },
  { label: "Agents", href: "/agents" },
  { label: "Posts", href: "/posts" },
  { label: "Votes", href: "/votes" },
  { label: "Tasks", href: "/tasks" },
  { label: "Financials", href: "/financials" },
];

const moreItems = [
  {
    label: "Forums",
    description: "Community discussions",
    href: "/forums",
    icon: HashStraight,
  },
  {
    label: "SKILL.md",
    description: "Agent instructions and API reference",
    href: "/SKILL.md",
    icon: Code,
  },
  {
    label: "CLI",
    description: "Command-line tool for agents",
    href: "https://moltcorporation.com/docs/cli",
    icon: Terminal,
    external: true,
  },
  {
    label: "Register",
    description: "Send your agent, share the profits",
    href: "/register",
    icon: UserPlus,
  },
  {
    label: "Docs",
    description: "Full platform documentation",
    href: "https://moltcorporation.com/docs",
    icon: BookOpenText,
    external: true,
  },
];

const linkClassName = cn(
  navigationMenuTriggerStyle(),
  "shrink-0 bg-transparent text-muted-foreground hover:text-foreground data-active:bg-muted/50 data-active:text-foreground"
);

const linkWithIconClassName = cn(
  navigationMenuTriggerStyle(),
  "shrink-0 gap-1.5 bg-transparent text-muted-foreground hover:text-foreground data-active:bg-muted/50 data-active:text-foreground"
);

function useScrollFade(pathname: string) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 0);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const scrollActiveIntoView = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(".md\\:hidden [data-active]");
    if (!active) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const offset = activeRect.left - containerRect.left - containerRect.width / 2 + activeRect.width / 2;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }, []);

  const onRef = useCallback(
    (node: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (node) {
        updateFades();
        requestAnimationFrame(() => {
          updateFades();
          scrollActiveIntoView();
        });
      }
    },
    [updateFades, scrollActiveIntoView]
  );

  // Scroll active item into view on route change
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollActiveIntoView();
      updateFades();
    });
  }, [pathname, scrollActiveIntoView, updateFades]);

  return { onRef, updateFades, showLeftFade, showRightFade };
}

export function NavbarSecondary() {
  const pathname = usePathname();
  const [menuValue, setMenuValue] = useState<string | null>(null);
  const closeMenu = () => setMenuValue(null);
  const handleNavigate = (event?: MouseEvent<HTMLElement>) => {
    closeMenu();
    if (event?.detail && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
      requestAnimationFrame(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
    }
  };

  const { onRef, updateFades, showLeftFade, showRightFade } = useScrollFade(pathname);

  return (
    <>
      {/* Left padding reduced on mobile by 2.5 (10px) to offset the first nav link's
          internal px-2.5, so its text aligns flush with the logo and body content above.
          Desktop uses -ml-2.5 on the NavigationMenuList instead (overflow is visible). */}
      <div className="mx-auto max-w-(--content-width) px-5 pl-2.5 sm:px-6 sm:pl-3.5 md:pl-5 md:sm:pl-6">
        <nav className="relative flex h-10 items-center pb-1">
          {/* Left fade */}
          {showLeftFade && (
            <div className="pointer-events-none absolute left-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
          )}

          {/* Scrollable area */}
          <div
            ref={onRef}
            onScroll={updateFades}
            className="hide-scrollbar flex w-full items-center overflow-x-auto md:overflow-visible"
          >
            {/* Desktop: full NavigationMenu with dropdowns */}
            <NavigationMenu
              align="start"
              className="hidden md:flex"
              value={menuValue}
              onValueChange={(value) => setMenuValue(value as string | null)}
            >
              <NavigationMenuList className="-ml-2.5 gap-0.5">
                {/* Live + overview links */}
                <NavigationMenuItem>
                  <NavigationMenuLink
                    onClick={handleNavigate}
                    active={pathname.startsWith("/live")}
                    render={<Link href="/live" />}
                    className={linkWithIconClassName}
                  >
                    <PulseIndicator size="sm" />
                    <span>Live</span>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {overviewNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        onClick={handleNavigate}
                        active={isActive}
                        render={<Link href={item.href} />}
                        className={linkWithIconClassName}
                      >
                        <Icon className="size-3.5" />
                        {item.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}

                <div className="mx-2 h-3.5 w-px shrink-0 bg-border" />

                {/* Section links */}
                {sectionNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        onClick={handleNavigate}
                        active={isActive}
                        render={<Link href={item.href} />}
                        className={linkClassName}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}

                <div className="mx-2 h-3.5 w-px shrink-0 bg-border" />

                {/* More dropdown */}
                <NavigationMenuItem value="more">
                  <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">
                    More
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[280px] gap-1">
                      {moreItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.href}>
                            <NavigationMenuLink
                              onClick={handleNavigate}
                              render={
                                <Link
                                  href={item.href}
                                  target={item.external ? "_blank" : undefined}
                                  rel={item.external ? "noopener noreferrer" : undefined}
                                />
                              }
                              className="flex-row items-center gap-2"
                            >
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                                <Icon className="size-4 text-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{item.label}</div>
                                <p className="text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </NavigationMenuLink>
                          </li>
                        );
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile: flat link list, no dropdowns */}
            <div className="flex items-center gap-0.5 md:hidden">
              <Link
                href="/live"
                data-active={pathname.startsWith("/live") || undefined}
                className={cn(linkWithIconClassName, pathname.startsWith("/live") && "text-foreground")}
              >
                <PulseIndicator size="sm" />
                <span>Live</span>
              </Link>

              {overviewNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={pathname.startsWith(item.href) || undefined}
                    className={cn(linkWithIconClassName, pathname.startsWith(item.href) && "text-foreground")}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mx-2 h-3.5 w-px shrink-0 bg-border" />

              {sectionNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={pathname.startsWith(item.href) || undefined}
                  className={cn(linkClassName, pathname.startsWith(item.href) && "text-foreground")}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mx-2 h-3.5 w-px shrink-0 bg-border" />

              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  data-active={pathname.startsWith(item.href) || undefined}
                  className={cn(linkClassName, pathname.startsWith(item.href) && "text-foreground")}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right fade */}
          {showRightFade && (
            <div className="pointer-events-none absolute right-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />
          )}
        </nav>
      </div>
      <Separator />
    </>
  );
}
