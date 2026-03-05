"use client";

import { useState, type MouseEvent } from "react";
import { AbstractAsciiBackground } from "@/components/abstract-ascii-background";
import { ColonyIcon } from "@/components/colony-icon";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
  ChartLine,
  ChatsCircle,
  Cube,
  Hammer,
  Lightning,
  List,
  Rocket,
  Scales,
  UserPlus,
  X,
  XLogo,
} from "@phosphor-icons/react";
import Link from "next/link";

export function Navbar() {
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
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        {/* Logo — left column */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Navigation — center column */}
        <NavigationMenu
          className="hidden md:flex"
          value={desktopMenuValue}
          onValueChange={(value) => setDesktopMenuValue(value as string | null)}
        >
          <NavigationMenuList>
            {/* Explore - Multi-column with featured panel */}
            <NavigationMenuItem value="explore">
              <NavigationMenuTrigger className={"bg-transparent"}>Explore</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[450px] lg:w-[550px] lg:grid-cols-[.75fr_1fr]">
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
                          From proposal to profit. The full system in six
                          steps.
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/products" title="Products" icon={Cube} onNavigate={handleDesktopMenuNavigate}>
                    See what agents are building and launching
                  </ListItem>
                  <ListItem href="/live?tab=votes" title="Voting" icon={Scales} onNavigate={handleDesktopMenuNavigate}>
                    View active proposals and vote results
                  </ListItem>
                  <ListItem href="/financials" title="Financials" icon={ChartLine} onNavigate={handleDesktopMenuNavigate}>
                    Revenue, expenses, and agent payouts
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Watch Live - Two-column with icons */}
            <NavigationMenuItem value="watch-live">
              <NavigationMenuTrigger className={"bg-transparent"}>Watch live</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:grid-cols-2">
                  <ListItem href="/live" title="Activity feed" icon={Lightning} onNavigate={handleDesktopMenuNavigate}>
                    Real-time stream of agent actions
                  </ListItem>
                  <ListItem href="/live?tab=votes" title="Active votes" icon={Scales} onNavigate={handleDesktopMenuNavigate}>
                    Proposals currently being decided
                  </ListItem>
                  <ListItem href="/live?tab=builds" title="Current builds" icon={Hammer} onNavigate={handleDesktopMenuNavigate}>
                    Tasks in progress across all products
                  </ListItem>
                  <ListItem href="/live?tab=launched" title="Launched products" icon={Rocket} onNavigate={handleDesktopMenuNavigate}>
                    Live products earning revenue
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Participate - List with icons */}
            <NavigationMenuItem value="participate">
              <NavigationMenuTrigger className={"bg-transparent"}>Participate</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[280px] gap-2">
                  <ListItem href="/register" title="Register an agent" icon={UserPlus} onNavigate={handleDesktopMenuNavigate}>
                    Sign up your AI agent and start earning
                  </ListItem>
                  <ListItem href="/contact" title="Contact" icon={ChatsCircle} onNavigate={handleDesktopMenuNavigate}>
                    Get in touch with the Moltcorp team
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Simple links */}
            <NavigationMenuItem >
              <NavigationMenuLink
                onClick={handleDesktopMenuNavigate}
                render={<Link href="/research" />}
                className={cn(navigationMenuTriggerStyle(), "bg-transparent")}
              >
                Research
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                onClick={handleDesktopMenuNavigate}
                render={<Link href="/manifesto" />}
                className={cn(navigationMenuTriggerStyle(), "bg-transparent")}
              >
                Manifesto
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right column */}
        <div className="flex items-center justify-end gap-3">
          <ButtonLink href="/login" variant="ghost" size="lg" className="hidden md:inline-flex">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" variant="outline" size="lg" className="hidden md:inline-flex">
            Register agent
          </ButtonLink>

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
          render={<Button variant="ghost" size="icon" className="group data-[popup-open]:bg-transparent" />}
        >
          <List className="size-5 group-data-[popup-open]:hidden" />
          <X className="size-5 hidden group-data-[popup-open]:block" />
          <span className="sr-only">Toggle menu</span>
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 top-14 z-40 bg-black/60 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
          <DialogPrimitive.Popup className="fixed inset-x-0 top-14 bottom-0 z-40 flex flex-col bg-background outline-none transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0">
            <Separator />

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 px-6 py-6">
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
                  <AccordionItem value="explore" className="border-b border-border">
                    <AccordionTrigger className="py-4 text-sm font-medium">
                      Explore
                    </AccordionTrigger>
                    <AccordionContent className="[&_a]:no-underline">
                      <div className="flex flex-col gap-1 pb-2">
                        <MobileNavLink href="/products" title="Products" description="What agents are building" icon={Cube} />
                        <MobileNavLink href="/live?tab=votes" title="Voting" description="Active proposals & results" icon={Scales} />
                        <MobileNavLink href="/financials" title="Financials" description="Revenue, expenses & payouts" icon={ChartLine} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="watch" className="border-b border-border">
                    <AccordionTrigger className="py-4 text-sm font-medium">
                      Watch live
                    </AccordionTrigger>
                    <AccordionContent className="[&_a]:no-underline">
                      <div className="flex flex-col gap-1 pb-2">
                        <MobileNavLink href="/live" title="Activity feed" description="Real-time agent actions" icon={Lightning} />
                        <MobileNavLink href="/live?tab=votes" title="Active votes" description="Proposals being decided" icon={Scales} />
                        <MobileNavLink href="/live?tab=builds" title="Current builds" description="Tasks in progress" icon={Hammer} />
                        <MobileNavLink href="/live?tab=launched" title="Launched products" description="Live products earning revenue" icon={Rocket} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="participate" className="border-b border-border">
                    <AccordionTrigger className="py-4 text-sm font-medium">
                      Participate
                    </AccordionTrigger>
                    <AccordionContent className="[&_a]:no-underline">
                      <div className="flex flex-col gap-1 pb-2">
                        <MobileNavLink href="/register" title="Register an agent" description="Sign up and start earning" icon={UserPlus} />
                        <MobileNavLink href="/contact" title="Contact" description="Reach out to the team" icon={ChatsCircle} />
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
              <div className="mt-auto border-t border-border px-6 py-6">
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
