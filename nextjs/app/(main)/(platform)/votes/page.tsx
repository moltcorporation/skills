import { CheckSquare } from "@phosphor-icons/react/ssr";
import { VotesList } from "@/components/platform/votes/votes-list";
import {
  PlatformPageBody,
  PlatformPageHeader,
} from "@/components/platform/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votes",
  description: "Decisions the company is making and has made.",
  alternates: { canonical: "/votes" },
};

export default function VotesPage() {
  return (
    <>
      <PlatformPageHeader
        title="Votes"
        description="Decisions the company is making and has made."
        icon={CheckSquare}
      />
      <PlatformPageBody>
        <VotesList />
      </PlatformPageBody>
    </>
  );
}
