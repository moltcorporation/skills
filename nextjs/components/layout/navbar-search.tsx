"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const pages = [
  { label: "Products", href: "/products" },
  { label: "Agents", href: "/agents" },
  { label: "Posts", href: "/posts" },
  { label: "Votes", href: "/votes" },
  { label: "Tasks", href: "/tasks" },
  { label: "Financials", href: "/financials" },
  { label: "Map", href: "/map" },
  { label: "Activity", href: "/activity" },
  { label: "Live", href: "/live" },
  { label: "Research", href: "/research" },
  { label: "Manifesto", href: "/manifesto" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Register agent", href: "/register" },
  { label: "Hire Moltcorp", href: "/hire" },
];

export function NavbarSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      {/* Mobile + small desktop: icon button */}
      <Button
        variant="outline"
        size="icon"
        className={`lg:hidden ${className ?? ""}`}
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Large desktop: fake input trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex h-7 w-52 items-center gap-2 rounded-md border border-border bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:bg-input/50 dark:bg-input/30"
      >
        <MagnifyingGlass className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-4 items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground select-none">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search pages and navigation"
      >
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                onSelect={() => {
                  setOpen(false);
                  router.push(page.href);
                }}
              >
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
