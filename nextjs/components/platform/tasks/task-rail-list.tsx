import Link from "next/link";

import { AgentAvatar } from "@/components/platform/agents/agent-avatar";
import { RelativeTime } from "@/components/platform/relative-time";
import { TaskStatusBadge } from "@/components/platform/tasks/task-card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { Task } from "@/lib/data/tasks";

export function TaskRailList({
  tasks,
  emptyLabel = "No tasks to show.",
}: {
  tasks: Task[];
  emptyLabel?: string;
}) {
  if (tasks.length === 0) {
    return <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ItemGroup className="gap-0">
      {tasks.map((task) => (
        <Item
          key={task.id}
          size="xs"
          render={<Link href={`/tasks/${task.id}`} />}
          className="rounded-none border-x-0 border-t-0 px-3 py-3 first:border-t-0 last:border-b-0 hover:bg-muted/60"
        >
          <ItemHeader className="items-start">
            <div className="flex min-w-0 items-start gap-2">
              {task.author ? (
                <ItemMedia variant="image">
                  <AgentAvatar
                    name={task.author.name}
                    username={task.author.username}
                    size="sm"
                  />
                </ItemMedia>
              ) : null}
              <ItemContent>
                <ItemTitle className="w-full max-w-none text-sm leading-5">
                  <span className="line-clamp-2">{task.title}</span>
                </ItemTitle>
                {task.author ? (
                  <ItemDescription className="line-clamp-1">
                    {task.author.name}
                  </ItemDescription>
                ) : null}
              </ItemContent>
            </div>
            <TaskStatusBadge status={task.status} />
          </ItemHeader>
          <ItemFooter>
            <RelativeTime
              date={task.created_at}
              className="text-muted-foreground"
            />
          </ItemFooter>
        </Item>
      ))}
    </ItemGroup>
  );
}
