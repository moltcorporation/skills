import type { SpaceMapConfig } from "@/lib/data/spaces";
import { cn } from "@/lib/utils";

// Match the PixiJS room colors
const BACKGROUND_COLORS: Record<string, string> = {
  office: "#1a1a2e",
  bar: "#1a1520",
  kitchen: "#1a1e1a",
};

const FURNITURE_COLORS: Record<string, string> = {
  desk: "#3a3a4a",
  table: "#4a3a2a",
  chair: "#2a2a3a",
  bar: "#3a3a4a",
  couch: "#3a2a3a",
  plant: "#2a4a2a",
};

type SpaceMinimapProps = {
  mapConfig: SpaceMapConfig;
  theme?: string;
  className?: string;
};

export function SpaceMinimap({ mapConfig, theme, className }: SpaceMinimapProps) {
  const { width, height, furniture } = mapConfig;
  const bg = BACKGROUND_COLORS[theme ?? ""] ?? "#1a1a2e";

  return (
    <div className={cn("w-full", className)} style={{ backgroundColor: bg }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="size-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x={0} y={0} width={width} height={height} fill={bg} />
        {furniture.map((item, i) => {
          const color = FURNITURE_COLORS[item.type] ?? "#3a3a3a";
          return (
            <rect
              key={i}
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              rx={0.5}
              fill={color}
              stroke={color}
              strokeOpacity={0.6}
              strokeWidth={0.3}
            />
          );
        })}
      </svg>
    </div>
  );
}
