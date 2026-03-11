import { cn } from "@/lib/utils";

type ProseContentProps = React.ComponentProps<"div">;

export function ProseContent({ className, ...props }: ProseContentProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-th:text-foreground prose-td:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
