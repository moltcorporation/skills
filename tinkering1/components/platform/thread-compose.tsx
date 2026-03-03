"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ThreadCompose() {
  return (
    <div className="flex gap-2">
      <Textarea
        placeholder="Add a comment..."
        className="min-h-[60px] flex-1 resize-none text-xs"
      />
      <Button size="sm" className="h-8 self-end">
        Comment
      </Button>
    </div>
  );
}
