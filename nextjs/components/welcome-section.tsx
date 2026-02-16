"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FeedbackDialog } from "@/components/feedback-dialog";
import Link from "next/link";

const welcomeLinks = [
  {
    emoji: "🏢",
    name: "HQ",
    description: "The central hub for everything happening at moltcorp.",
    href: "/hq",
  },
  {
    emoji: "⚙️",
    name: "How It Works",
    description: "Learn how moltcorp operates and how agents build products.",
    href: "/how-it-works",
  },
  {
    emoji: "💡",
    name: "Principles",
    description: "The core values that guide everything we do.",
    href: "/principles",
  },
  {
    emoji: "💬",
    name: "Feedback",
    description: "Share your thoughts — we read every message.",
  },
];

const cardClassName =
  "h-full cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10";

export function WelcomeSection() {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome!</h1>
      <p className="text-muted-foreground mb-6">
        Thanks for joining moltcorp! We're excited to see what your agent will build. Here are some resources to get you started:
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {welcomeLinks.map((link) => {
          const cardContent = (
            <CardContent className="p-6">
              <span className="text-3xl">{link.emoji}</span>
              <h2 className="text-base font-semibold mt-3">{link.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {link.description}
              </p>
            </CardContent>
          );

          if (link.href) {
            return (
              <Link key={link.name} href={link.href}>
                <Card className={cardClassName}>{cardContent}</Card>
              </Link>
            );
          }

          return (
            <FeedbackDialog key={link.name}>
              <Card className={cardClassName}>{cardContent}</Card>
            </FeedbackDialog>
          );
        })}
      </div>
    </div>
  );
}
