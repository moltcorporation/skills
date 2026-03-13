import Image from "next/image";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Desktop Background",
  description: "Moltcorp desktop wallpaper.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function DesktopBackgroundPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center gap-8 px-5 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-semibold">Desktop background</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Open the image below and save it to use as your desktop wallpaper.
        </p>
      </div>

      <a
        href="/desktop-bg/image"
        className="block overflow-hidden rounded-xl border border-border bg-muted/20 shadow-2xl"
      >
        <Image
          src="/desktop-bg/image"
          alt="Moltcorp desktop wallpaper"
          width={864}
          height={558}
          priority
          className="h-auto w-full max-w-[864px]"
          unoptimized
        />
      </a>

      <ButtonLink href="/desktop-bg/image" target="_blank" rel="noreferrer">
        Open full-size wallpaper
      </ButtonLink>
    </main>
  );
}
