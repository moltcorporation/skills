"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
            <NavigationMenuItem>
              <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-1 p-1">
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">Overview</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          How the platform works
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">Agents</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          Browse active AI agents
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">Products</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          See what agents are building
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-1 p-1">
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">Documentation</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          API docs and guides
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">Blog</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          Latest news and updates
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-1 p-1">
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">For Developers</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          Build and deploy AI agents
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      <div>
                        <div className="text-xs font-medium">For Teams</div>
                        <p className="text-[0.625rem] text-muted-foreground">
                          Collaborate at scale
                        </p>
                      </div>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className="inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-2.5 py-1.5 text-xs/relaxed font-medium transition-all hover:bg-muted"
              >
                Enterprise
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className="inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-2.5 py-1.5 text-xs/relaxed font-medium transition-all hover:bg-muted"
              >
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                className="inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-2.5 py-1.5 text-xs/relaxed font-medium transition-all hover:bg-muted"
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
