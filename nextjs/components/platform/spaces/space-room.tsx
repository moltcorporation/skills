"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Container as ContainerType, Graphics as GraphicsType, Ticker } from "pixi.js";
import { useSpaceMembersRealtime } from "@/lib/client-data/spaces/members";
import type { Space, SpaceMember, SpaceMapConfig } from "@/lib/data/spaces";

extend({ Container, Graphics, Text });

const CELL_SIZE = 16;
const AVATAR_RADIUS = 6;

const BACKGROUND_COLORS: Record<string, number> = {
  office: 0x1a1a2e,
  bar: 0x1a1520,
  kitchen: 0x1a1e1a,
};

const FURNITURE_COLORS: Record<string, number> = {
  desk: 0x3a3a4a,
  table: 0x4a3a2a,
  chair: 0x2a2a3a,
  plant: 0x2a4a2a,
  bar: 0x4a3a3a,
  couch: 0x3a2a4a,
};

const GRID_LINE_COLOR = 0xffffff;
const GRID_LINE_ALPHA = 0.04;

function hashColor(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const s = 0.6;
  const l = 0.55;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(c * 255);
  };
  return (f(0) << 16) + (f(8) << 8) + f(4);
}

type SpaceRoomProps = {
  space: Space;
  initialMembers: SpaceMember[];
};

type ViewportSize = {
  width: number;
  height: number;
};

type HoveredAgentState = {
  member: SpaceMember;
  left: number;
  top: number;
};

function formatAgentLocation(member: SpaceMember) {
  return [member.agent?.city, member.agent?.country].filter(Boolean).join(", ");
}

export function SpaceRoom({ space, initialMembers }: SpaceRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const { data } = useSpaceMembersRealtime({
    slug: space.slug,
    spaceId: space.id,
    initialData: initialMembers,
  });
  const members = data?.members ?? initialMembers;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);

      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (size.width === 0 || size.height === 0) {
      setCanvasVisible(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setCanvasVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [size.height, size.width, space.id]);

  const hoveredAgent = useMemo<HoveredAgentState | null>(() => {
    if (!hoveredAgentId || size.width === 0 || size.height === 0) return null;

    const member = members.find((entry) => entry.agent_id === hoveredAgentId);
    if (!member) return null;

    const mapWidth = space.map_config.width * CELL_SIZE;
    const mapHeight = space.map_config.height * CELL_SIZE;
    const scale = Math.min(size.width / mapWidth, size.height / mapHeight);

    if (!Number.isFinite(scale) || scale <= 0) return null;

    const offsetX = (size.width - mapWidth * scale) / 2;
    const offsetY = (size.height - mapHeight * scale) / 2;
    const centerX = (member.x * CELL_SIZE + CELL_SIZE / 2) * scale + offsetX;
    const centerY = (member.y * CELL_SIZE + CELL_SIZE / 2) * scale + offsetY;

    return {
      member,
      left: centerX,
      top: centerY,
    };
  }, [hoveredAgentId, members, size.height, size.width, space.map_config.height, space.map_config.width]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[36rem] overflow-hidden rounded-sm border border-border bg-card"
    >
      {size.width > 0 && size.height > 0 ? (
        <Application
          key={space.id}
          className={canvasVisible ? "block opacity-100 transition-opacity duration-150" : "block opacity-0 transition-opacity duration-150"}
          width={size.width}
          height={size.height}
          background={BACKGROUND_COLORS[space.theme] ?? 0x1a1a2e}
          antialias={false}
          roundPixels
          autoDensity
        >
          <SpaceRoomStage
            space={space}
            members={members}
            viewport={size}
            onHoverChange={setHoveredAgentId}
          />
        </Application>
      ) : null}
      {hoveredAgent ? <HoveredAgentCard hoveredAgent={hoveredAgent} /> : null}
    </div>
  );
}

function SpaceRoomStage({
  space,
  members,
  viewport,
  onHoverChange,
}: {
  space: Space;
  members: SpaceMember[];
  viewport: ViewportSize;
  onHoverChange: (agentId: string | null) => void;
}) {
  const mapWidth = space.map_config.width * CELL_SIZE;
  const mapHeight = space.map_config.height * CELL_SIZE;
  const scale = Math.min(viewport.width / mapWidth, viewport.height / mapHeight);
  const offsetX = (viewport.width - mapWidth * scale) / 2;
  const offsetY = (viewport.height - mapHeight * scale) / 2;

  if (!Number.isFinite(scale) || scale <= 0) return null;

  return (
    <pixiContainer x={offsetX} y={offsetY} scale={scale}>
      <RoomBackground config={space.map_config} />
      <RoomGrid config={space.map_config} />
      {space.map_config.furniture.map((item, index) => (
        <FurnitureItem key={index} item={item} />
      ))}
      {members.map((member) => (
        <AgentAvatar
          key={member.agent_id}
          member={member}
          onHoverChange={onHoverChange}
        />
      ))}
    </pixiContainer>
  );
}

function RoomBackground({ config }: { config: SpaceMapConfig }) {
  const draw = useCallback(
    (g: GraphicsType) => {
      g.clear();
      g.rect(0, 0, config.width * CELL_SIZE, config.height * CELL_SIZE);
      g.fill({ color: 0x000000, alpha: 0.3 });
      g.stroke({ color: 0xffffff, alpha: 0.08, width: 1 });
    },
    [config.width, config.height],
  );

  return <pixiGraphics draw={draw} />;
}

function RoomGrid({ config }: { config: SpaceMapConfig }) {
  const draw = useCallback(
    (g: GraphicsType) => {
      g.clear();
      for (let x = 0; x <= config.width; x++) {
        g.moveTo(x * CELL_SIZE, 0);
        g.lineTo(x * CELL_SIZE, config.height * CELL_SIZE);
      }
      for (let y = 0; y <= config.height; y++) {
        g.moveTo(0, y * CELL_SIZE);
        g.lineTo(config.width * CELL_SIZE, y * CELL_SIZE);
      }
      g.stroke({ color: GRID_LINE_COLOR, alpha: GRID_LINE_ALPHA, width: 0.5 });
    },
    [config.width, config.height],
  );

  return <pixiGraphics draw={draw} />;
}

type FurnitureItemType = SpaceMapConfig["furniture"][number];

function FurnitureItem({ item }: { item: FurnitureItemType }) {
  const color = FURNITURE_COLORS[item.type] ?? 0x3a3a3a;

  const draw = useCallback(
    (g: GraphicsType) => {
      g.clear();
      if (item.type === "chair" || item.type === "plant") {
        const cx = (item.width * CELL_SIZE) / 2;
        const cy = (item.height * CELL_SIZE) / 2;
        const radius = Math.min(item.width, item.height) * CELL_SIZE * 0.4;
        g.circle(cx, cy, radius);
      } else {
        g.roundRect(0, 0, item.width * CELL_SIZE, item.height * CELL_SIZE, 2);
      }
      g.fill({ color, alpha: 0.6 });
      g.stroke({ color: 0xffffff, alpha: 0.1, width: 0.5 });
    },
    [color, item.height, item.type, item.width],
  );

  const labelStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "monospace",
        fontSize: 9,
        fill: 0x888888,
        align: "center",
      }),
    [],
  );

  return (
    <pixiContainer x={item.x * CELL_SIZE} y={item.y * CELL_SIZE}>
      <pixiGraphics draw={draw} />
      {item.label ? (
        <pixiText
          text={item.label}
          style={labelStyle}
          x={(item.width * CELL_SIZE) / 2}
          y={(item.height * CELL_SIZE) / 2}
          anchor={{ x: 0.5, y: 0.5 }}
        />
      ) : null}
    </pixiContainer>
  );
}

function AgentAvatar({
  member,
  onHoverChange,
}: {
  member: SpaceMember;
  onHoverChange: (agentId: string | null) => void;
}) {
  const router = useRouter();
  const targetX = member.x * CELL_SIZE + CELL_SIZE / 2;
  const targetY = member.y * CELL_SIZE + CELL_SIZE / 2;
  const containerRef = useRef<ContainerType>(null);
  const posRef = useRef({ x: targetX, y: targetY });
  const targetRef = useRef({ x: targetX, y: targetY });
  const color = hashColor(member.agent_id);

  targetRef.current = { x: targetX, y: targetY };

  const tickCallback = useCallback((ticker: Ticker) => {
    const node = containerRef.current;
    if (!node) return;

    const current = posRef.current;
    const target = targetRef.current;
    const lerpFactor = 1 - Math.pow(0.001, ticker.deltaTime / 60);

    const nextX = current.x + (target.x - current.x) * lerpFactor;
    const nextY = current.y + (target.y - current.y) * lerpFactor;

    if (Math.abs(nextX - current.x) > 0.01 || Math.abs(nextY - current.y) > 0.01) {
      posRef.current = { x: nextX, y: nextY };
      node.x = nextX;
      node.y = nextY;
    }
  }, []);

  useTick(tickCallback);

  const drawAvatar = useCallback(
    (g: GraphicsType) => {
      g.clear();
      g.circle(0, 0, AVATAR_RADIUS);
      g.fill({ color, alpha: 0.9 });
      g.stroke({ color: 0xffffff, alpha: 0.3, width: 1 });
    },
    [color],
  );

  const nameStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "monospace",
        fontSize: 8,
        fill: 0xcccccc,
        align: "center",
      }),
    [],
  );

  const name = member.agent?.name ?? member.agent?.username ?? "?";
  const username = member.agent?.username;

  return (
    <pixiContainer
      ref={containerRef}
      x={posRef.current.x}
      y={posRef.current.y}
      eventMode="static"
      cursor={username ? "pointer" : "default"}
      onPointerEnter={() => onHoverChange(member.agent_id)}
      onPointerLeave={() => onHoverChange(null)}
      onPointerTap={() => {
        if (!username) return;
        router.push(`/agents/${username}`);
      }}
    >
      <pixiGraphics draw={drawAvatar} />
      <pixiText
        text={name}
        style={nameStyle}
        y={AVATAR_RADIUS + 3}
        anchor={{ x: 0.5, y: 0 }}
      />
    </pixiContainer>
  );
}

function HoveredAgentCard({ hoveredAgent }: { hoveredAgent: HoveredAgentState }) {
  const name = hoveredAgent.member.agent?.name ?? "Unknown";
  const username = hoveredAgent.member.agent?.username ?? "unknown";
  const bio = hoveredAgent.member.agent?.bio?.trim();
  const location = formatAgentLocation(hoveredAgent.member);

  return (
    <div
      className="pointer-events-none absolute z-10 w-52 -translate-x-1/2 -translate-y-full rounded-sm border border-border/80 bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      style={{
        left: hoveredAgent.left,
        top: hoveredAgent.top - 10,
      }}
    >
      <div className="truncate text-xs font-medium text-foreground">{name}</div>
      <div className="truncate text-[11px] text-muted-foreground">@{username}</div>
      {location ? (
        <div className="pt-1 text-[11px] text-muted-foreground">{location}</div>
      ) : null}
      {bio ? (
        <p className="pt-1 text-[11px] leading-4 text-foreground/80 line-clamp-3">
          {bio}
        </p>
      ) : null}
    </div>
  );
}
