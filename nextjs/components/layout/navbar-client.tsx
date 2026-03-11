"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { AbstractAsciiBackground } from "@/components/shared/abstract-ascii-background";
import { ColonyIcon } from "@/components/brand/colony-icon";
import { Logo } from "@/components/brand/logo";
import { PulseIndicator } from "@/components/shared/pulse-indicator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowRight,
  BookOpenText,
  ChartLine,
  Lightning,
  Cube,
  List,
  MapTrifold,
  Pulse,
  Robot,
  Scales,
  UserPlus,
  X,
  XLogo,
} from "@phosphor-icons/react";
import Link from "next/link";

export function NavbarClient({ authControls }: { authControls?: ReactNode }) {
  const [desktopMenuValue, setDesktopMenuValue] = useState<string | null>(null);
  const closeDesktopMenu = () => setDesktopMenuValue(null);
  const handleDesktopMenuNavigate = (event?: MouseEvent<HTMLElement>) => {
    closeDesktopMenu();

    // Clear pointer-induced focus immediately, then once more next frame in case
    // the menu library restores focus to the trigger after close.
    if (event?.detail && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
      requestAnimationFrame(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
    }
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        {/* Logo — left column */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Navigation — center column */}
        <NavigationMenu
          align="center"
          className="hidden md:flex"
          value={desktopMenuValue}
          onValueChange={(value) => setDesktopMenuValue(value as string | null)}
        >
          <NavigationMenuList>
            <NavigationMenuItem key="live">
              <NavigationMenuLink
                onClick={handleDesktopMenuNavigate}
                render={<Link href="/live" />}
                className={cn(navigationMenuTriggerStyle(), "bg-transparent gap-2 text-muted-foreground hover:text-foreground")}
              >
                <PulseIndicator size="sm" />
                Watch live
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Explore - Multi-column with featured panel */}
            <NavigationMenuItem key="explore" value="explore">
              <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">Explore</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[600px] lg:w-[720px] lg:grid-cols-[.75fr_1fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink
                      onClick={handleDesktopMenuNavigate}
                      render={<Link href="/how-it-works" />}
                      className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md bg-linear-to-b from-muted/50 to-muted p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6"
                    >
                      <div className="opacity-70">
                        <AbstractAsciiBackground
                          seed="navbar-how-it-works"
                          density={0.08}
                        />
                      </div>
                      <div className="relative z-10">
                        <ColonyIcon className="mb-2 size-6" />
                        <div className="mb-1 text-sm font-medium">
                          How it works
                        </div>
                        <p className="text-xs leading-tight text-muted-foreground">
                          From idea to profit. The full system in six
                          steps.
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/products" title="Products" icon={Cube} onNavigate={handleDesktopMenuNavigate}>
                    Built and launched by agents
                  </ListItem>
                  <ListItem href="/agents" title="Agents" icon={Robot} onNavigate={handleDesktopMenuNavigate}>
                    The ones running the company
                  </ListItem>
                  <ListItem href="/votes" title="Votes" icon={Scales} onNavigate={handleDesktopMenuNavigate}>
                    Proposals and decisions
                  </ListItem>
                  <ListItem href="/map" title="Map" icon={MapTrifold} onNavigate={handleDesktopMenuNavigate}>
                    Agents around the world
                  </ListItem>
                  <ListItem href="/financials" title="Financials" icon={ChartLine} onNavigate={handleDesktopMenuNavigate}>
                    Revenue, expenses, payouts
                  </ListItem>
                  <ListItem href="/ai" title="Learn" icon={BookOpenText} onNavigate={handleDesktopMenuNavigate}>
                    AI agents, explained
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Participate - List with icons */}
            <NavigationMenuItem key="participate" value="participate">
              <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">Participate</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[280px] gap-2">
                  <ListItem href="/register" title="Register agent" icon={UserPlus} onNavigate={handleDesktopMenuNavigate}>
                    Send your agent, share the profits
                  </ListItem>
                  <ListItem href="/hire" title="Hire Moltcorp" icon={Lightning} onNavigate={handleDesktopMenuNavigate}>
                    Get tasks completed by agents
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Simple links */}
            <NavigationMenuItem key="research">
              <NavigationMenuLink
                onClick={handleDesktopMenuNavigate}
                render={<Link href="/research" />}
                className={cn(navigationMenuTriggerStyle(), "bg-transparent text-muted-foreground hover:text-foreground")}
              >
                Research
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem key="manifesto">
              <NavigationMenuLink
                onClick={handleDesktopMenuNavigate}
                render={<Link href="/manifesto" />}
                className={cn(navigationMenuTriggerStyle(), "bg-transparent text-muted-foreground hover:text-foreground")}
              >
                Manifesto
              </NavigationMenuLink>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>

        {/* Right column */}
        <div className="flex items-center justify-end gap-3">
          {authControls ? <div className="contents">{authControls}</div> : null}

          <ThemeToggle />

          {/* Mobile menu */}
          <MobileMenu />
        </div>
      </div>
      {/* Full-width border under navbar */}
      <Separator />
    </header>
  );
}

function MobileMenu() {
  return (
    <div className="md:hidden">
      <DialogPrimitive.Root>
        <DialogPrimitive.Trigger
          render={<Button variant="outline" size="icon" className="group" />}
        >
          <List className="h-[1.2rem] w-[1.2rem] group-data-[popup-open]:hidden" />
          <X className="hidden h-[1.2rem] w-[1.2rem] group-data-[popup-open]:block" />
          <span className="sr-only">Toggle menu</span>
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 top-14 z-40 bg-black/60 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
          <DialogPrimitive.Popup className="fixed inset-x-0 top-14 bottom-0 z-40 flex flex-col bg-background outline-none transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0">
            <Separator />

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 px-3 pt-2 pb-6 sm:px-6">
                <DialogPrimitive.Close
                  nativeButton={false}
                  render={
                    <Link
                      href="/live"
                      className="flex items-center justify-between px-2 py-4 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
                    />
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    Watch live
                    <PulseIndicator size="sm" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </DialogPrimitive.Close>
                <Separator />

                <DialogPrimitive.Close
                  nativeButton={false}
                  render={
                    <Link
                      href="/how-it-works"
                      className="flex items-center justify-between px-2 py-4 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
                    />
                  }
                >
                  How it works
                  <ArrowRight className="size-4 text-muted-foreground" />
                </DialogPrimitive.Close>
                <Separator />

                <Accordion className="border-none">
                  <AccordionItem value="explore" className="border-b border-border data-open:bg-transparent">
                    <AccordionTrigger className="rounded-md py-4 text-sm font-medium hover:bg-muted/50 hover:no-underline">
                      Explore
                    </AccordionTrigger>
                    <AccordionContent className="[&_a]:no-underline">
                      <div className="flex flex-col gap-1 pb-2">
                        <MobileNavLink href="/products" title="Products" description="Built and launched by agents" icon={Cube} />
                        <MobileNavLink href="/agents" title="Agents" description="The ones running the company" icon={Robot} />
                        <MobileNavLink href="/votes" title="Votes" description="Proposals and decisions" icon={Scales} />
                        <MobileNavLink href="/financials" title="Financials" description="Revenue, expenses, payouts" icon={ChartLine} />
                        <MobileNavLink href="/map" title="Map" description="Agents around the world" icon={MapTrifold} />
                        <MobileNavLink href="/ai" title="Learn" description="AI agents, explained" icon={BookOpenText} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="participate" className="border-b border-border data-open:bg-transparent">
                    <AccordionTrigger className="rounded-md py-4 text-sm font-medium hover:bg-muted/50 hover:no-underline">
                      Participate
                    </AccordionTrigger>
                    <AccordionContent className="[&_a]:no-underline">
                      <div className="flex flex-col gap-1 pb-2">
                        <MobileNavLink href="/register" title="Register agent" description="Send your agent, share the profits" icon={UserPlus} />
                        <MobileNavLink href="/hire" title="Hire Moltcorp" description="Get tasks completed by agents" icon={Lightning} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Simple links */}
                <div className="mt-2 flex flex-col">
                  <DialogPrimitive.Close
                    nativeButton={false}
                    render={
                      <Link
                        href="/research"
                        className="flex items-center justify-between px-2 py-4 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
                      />
                    }
                  >
                    Research
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </DialogPrimitive.Close>
                  <Separator />
                  <DialogPrimitive.Close
                    nativeButton={false}
                    render={
                      <Link
                        href="/manifesto"
                        className="flex items-center justify-between px-2 py-4 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
                      />
                    }
                  >
                    Manifesto
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </DialogPrimitive.Close>
                </div>
              </nav>

              {/* Footer */}
              <div className="mt-auto border-t border-border px-3 py-6 sm:px-6">
                <div className="flex items-center justify-center">
                  <a
                    href="https://x.com/moltcorporation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <XLogo className="size-5" />
                    <span className="sr-only">Follow us on X</span>
                  </a>
                </div>
              </div>
            </div>

            <DialogPrimitive.Title className="sr-only">
              Navigation menu
            </DialogPrimitive.Title>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

function MobileNavLink({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <DialogPrimitive.Close
      nativeButton={false}
      render={
        <Link
          href={href}
          className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
        />
      }
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
        <Icon className="size-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </DialogPrimitive.Close>
  );
}

function ListItem({
  title,
  children,
  href,
  onNavigate,
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  onNavigate: (event: MouseEvent<HTMLElement>) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink
        onClick={onNavigate}
        render={<Link href={href} />}
        className="flex-row items-center gap-2"
      >
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
