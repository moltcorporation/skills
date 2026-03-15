"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

export function UgcNav({
  sections,
  mobileHeaderHeight,
}: {
  sections: { id: string; label: string }[];
  mobileHeaderHeight: number;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const desktopNavRef = useRef<HTMLElement>(null);
  const navTopRef = useRef(0);
  const mobileActiveRef = useRef<HTMLAnchorElement>(null);

  // Desktop: position sidebar relative to content
  useEffect(() => {
    function position() {
      const content = document.getElementById("ugc-content");
      const title = document.getElementById("first-section-title");
      const nav = desktopNavRef.current;
      if (!content || !nav) return;

      const contentLeft = content.getBoundingClientRect().left;
      const left = contentLeft - nav.offsetWidth - 160;
      nav.style.left = `${Math.max(8, left)}px`;

      if (title) {
        const top = title.getBoundingClientRect().top + window.scrollY;
        nav.style.top = `${top}px`;
        navTopRef.current = top;
      }

      nav.style.opacity = "1";
    }

    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, []);

  // Track active section via intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  // Auto-scroll mobile tab strip to keep active item visible
  useEffect(() => {
    mobileActiveRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeId]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      setActiveId(id);

      const el = document.getElementById(id);
      if (!el) return;

      const elTop = el.getBoundingClientRect().top + window.scrollY;
      const isDesktop = window.innerWidth >= 1280;

      if (isDesktop) {
        // Align section title with desktop nav's vertical position
        window.scrollTo({
          top: elTop - navTopRef.current,
          behavior: "smooth",
        });
      } else {
        // Offset by sticky header height + breathing room
        window.scrollTo({
          top: elTop - mobileHeaderHeight - 65,
          behavior: "smooth",
        });
      }

      history.replaceState(null, "", `#${id}`);
    },
    [mobileHeaderHeight],
  );

  return (
    <>
      {/* Mobile: sticky header — logo row + horizontal tab nav */}
      <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 xl:hidden">
        <div className="flex items-center border-b border-border px-6 py-3">
          <Logo />
          <div className="mx-[11px] h-[22px] w-px bg-foreground/20" />
          <span className="text-base font-semibold text-foreground mt-px">
            UGC
          </span>
        </div>
        <div className="flex overflow-x-auto scrollbar-none px-6">
          {sections.map((s) => (
            <a
              key={s.id}
              ref={activeId === s.id ? mobileActiveRef : undefined}
              href={`#${s.id}`}
              onClick={(e) => handleClick(e, s.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-xs transition-colors",
                activeId === s.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Desktop: fixed sidebar nav */}
      <nav
        ref={desktopNavRef}
        className="fixed hidden xl:block z-10 opacity-0 transition-opacity duration-200"
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Contents
        </p>
        <ul className="space-y-0.5 border-l border-border">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className={cn(
                  "block py-1.5 pl-4 text-xs transition-colors -ml-px border-l",
                  activeId === s.id
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
