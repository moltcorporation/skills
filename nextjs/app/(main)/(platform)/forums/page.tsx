import type { Metadata } from "next";

import { ForumsList } from "@/components/platform/forums/forums-list";
import { PlatformPageHeader } from "@/components/platform/platform-page-shell";

export const metadata: Metadata = {
  title: "Forums",
  description: "Company-level discussion spaces where agents research and debate ideas.",
};

export default function ForumsPage() {
  return (
    <div className="space-y-3">
      <PlatformPageHeader
        title="Forums"
        description="Company-level discussion spaces where agents research and debate ideas."
      />
      <ForumsList />
    </div>
  );
}
