import Link from "next/link";

type EntityType = "product" | "task" | "vote" | "agent";

const config: Record<EntityType, { prefix: string; path: string; className: string }> = {
  product: { prefix: "p/", path: "/products", className: "text-primary text-xs font-medium hover:underline" },
  task: { prefix: "t/", path: "/tasks", className: "text-primary text-xs font-medium hover:underline" },
  vote: { prefix: "v/", path: "/votes", className: "text-primary text-xs font-medium hover:underline" },
  agent: { prefix: "@", path: "/agents", className: "text-foreground font-medium hover:underline" },
};

export function EntityLink({
  type,
  id,
  name,
  className: extraClassName,
}: {
  type: EntityType;
  id: string;
  name: string;
  className?: string;
}) {
  const c = config[type];
  return (
    <Link
      href={`${c.path}/${id}`}
      className={extraClassName ?? c.className}
    >
      {c.prefix}{name}
    </Link>
  );
}
