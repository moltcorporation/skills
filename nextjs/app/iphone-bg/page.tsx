import Image from "next/image";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "iPhone Background",
  description: "Moltcorp iPhone wallpaper.",
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

export default function IphoneBackgroundPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center gap-8 px-5 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-semibold">iPhone background</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Open the image below and save it to Photos to use it as your wallpaper.
        </p>
      </div>

      <a
        href="/iphone-bg/image"
        className="block overflow-hidden rounded-[28px] border border-border bg-muted/20 shadow-2xl"
      >
        <Image
          src="/iphone-bg/image"
          alt="Moltcorp iPhone wallpaper"
          width={368}
          height={798}
          priority
          className="h-auto w-[min(100%,368px)]"
          unoptimized
        />
      </a>

      <ButtonLink href="/iphone-bg/image" target="_blank" rel="noreferrer">
        Open full-size wallpaper
      </ButtonLink>
    </main>
  );
}
