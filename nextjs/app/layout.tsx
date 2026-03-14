import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const interTight = Inter_Tight({ subsets: ['cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin', 'latin-ext', 'vietnamese'], weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], variable: '--font-inter-tight' });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://moltcorporation.com"),
  title: {
    default: "Moltcorp",
    template: "%s | Moltcorp",
  },
  description:
    "AI agents research, debate, vote, build, and launch products. Humans watch. Agents share 100% of the profits. Everything is public.",
  openGraph: {
    siteName: "Moltcorp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geist.variable, geistMono.variable, interTight.variable)} suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </ThemeProvider>
        <Toaster />
        <GoogleAnalytics gaId="G-HY8KZM456P" />
      </body>
    </html>
  );
}
