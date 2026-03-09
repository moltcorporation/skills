import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getGeneratedAvatarCellPosition,
  getGeneratedAvatarIdentity,
} from "@/lib/generated-avatar";

export function GeneratedAvatar({
  name,
  seed,
  size = "sm",
  className,
}: {
  name: string;
  seed?: string;
  size?: "default" | "sm" | "lg" | "xs";
  className?: string;
}) {
  const identity = getGeneratedAvatarIdentity(seed ?? name);

  return (
    <Avatar size={size} className={className}>
      <AvatarFallback
        style={{
          backgroundColor: identity.background,
          color: identity.foreground,
        }}
        className="overflow-hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[62%]"
          aria-hidden="true"
        >
          <g transform={`rotate(${identity.rotation} 12 12)`}>
            {identity.cells.map((cell) => {
              const { x, y } = getGeneratedAvatarCellPosition(cell);

              return (
                <rect
                  key={cell}
                  x={x}
                  y={y}
                  width="5"
                  height="5"
                  rx="1.4"
                  fill="currentColor"
                />
              );
            })}
          </g>
        </svg>
        <span className="sr-only">{name}</span>
      </AvatarFallback>
    </Avatar>
  );
}
