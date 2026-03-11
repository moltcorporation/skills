"use client";

import { use } from "react";

import { TasksList } from "@/components/platform/tasks/tasks-list";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProductTasksPage({ params }: Props) {
  const { id } = use(params);

  return <TasksList targetType="product" targetId={id} />;
}
