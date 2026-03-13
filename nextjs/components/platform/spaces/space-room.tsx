"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Application, extend, useApplication, useTick } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Container as ContainerType, Graphics as GraphicsType, Ticker } from "pixi.js";
import { useSpaceMembersRealtime } from "@/lib/client-data/spaces/members";
import type { Space, SpaceMember, SpaceMapConfig } from "@/lib/data/spaces";

extend({ Container, Graphics, Text });

// ======================================================
// Constants
// ======================================================

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

// ======================================================
// Color from string
// ======================================================

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

// ======================================================
// SpaceRoom (exported, used by loader)
// ======================================================

type SpaceRoomProps = {
  space: Space;
  initialMembers: SpaceMember[];
};

export function SpaceRoom({ space, initialMembers }: SpaceRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="min-h-[36rem] overflow-hidden rounded-sm border border-border bg-card"
    >
      <Application
        resizeTo={containerRef}
        background={BACKGROUND_COLORS[space.theme] ?? 0x1a1a2e}
        antialias={false}
        roundPixels
        autoDensity
      >
        <SpaceRoomContent space={space} initialMembers={initialMembers} />
      </Application>
    </div>
  );
}

// ======================================================
// Room Content (inside Application context)
// ======================================================

function SpaceRoomContent({ space, initialMembers }: SpaceRoomProps) {
  const { app, isInitialised } = useApplication();
  const { data } = useSpaceMembersRealtime({
    slug: space.slug,
    spaceId: space.id,
    initialData: initialMembers,
  });
  const members = data?.members ?? initialMembers;

  const mapWidth = space.map_config.width * CELL_SIZE;
  const mapHeight = space.map_config.height * CELL_SIZE;

  const [layout, setLayout] = useState<{ scale: number; offsetX: number; offsetY: number } | null>(null);

  // Compute layout from current screen size
  const computeLayout = useCallback(() => {
    if (!isInitialised || !app?.screen) return null;
    const w = app.screen.width;
    const h = app.screen.height;
    if (w === 0 || h === 0) return null;
    const s = Math.min(w / mapWidth, h / mapHeight);
    return {
      scale: s,
      offsetX: (w - mapWidth * s) / 2,
      offsetY: (h - mapHeight * s) / 2,
    };
  }, [app, isInitialised, mapWidth, mapHeight]);

  // Set layout once app is initialised
  useEffect(() => {
    if (!isInitialised) return;
    const next = computeLayout();
    if (next) setLayout(next);
  }, [isInitialised, computeLayout]);

  // Listen for resize events
  useEffect(() => {
    if (!isInitialised || !app?.renderer) return;

    function onResize() {
      const next = computeLayout();
      if (next) setLayout(next);
    }

    app.renderer.on("resize", onResize);
    return () => {
      app.renderer?.off("resize", onResize);
    };
  }, [app, isInitialised, computeLayout]);

  if (!isInitialised || !layout) return null;

  return (
    <pixiContainer x={layout.offsetX} y={layout.offsetY} scale={layout.scale}>
      <RoomBackground config={space.map_config} />
      <RoomGrid config={space.map_config} />
      {space.map_config.furniture.map((item, i) => (
        <FurnitureItem key={i} item={item} />
      ))}
      {members.map((member) => (
        <AgentAvatar key={member.agent_id} member={member} />
      ))}
    </pixiContainer>
  );
}

// ======================================================
// Room Background
// ======================================================

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

// ======================================================
// Room Grid
// ======================================================

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

// ======================================================
// Furniture
// ======================================================

type FurnitureItemType = SpaceMapConfig["furniture"][number];

function FurnitureItem({ item }: { item: FurnitureItemType }) {
  const color = FURNITURE_COLORS[item.type] ?? 0x3a3a3a;

  const draw = useCallback(
    (g: GraphicsType) => {
      g.clear();
      if (item.type === "chair" || item.type === "plant") {
        const cx = (item.width * CELL_SIZE) / 2;
        const cy = (item.height * CELL_SIZE) / 2;
        const r = Math.min(item.width, item.height) * CELL_SIZE * 0.4;
        g.circle(cx, cy, r);
      } else {
        g.roundRect(0, 0, item.width * CELL_SIZE, item.height * CELL_SIZE, 2);
      }
      g.fill({ color, alpha: 0.6 });
      g.stroke({ color: 0xffffff, alpha: 0.1, width: 0.5 });
    },
    [item.width, item.height, item.type, color],
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

// ======================================================
// Agent Avatar (with lerp interpolation)
// ======================================================

function AgentAvatar({ member }: { member: SpaceMember }) {
  const targetX = member.x * CELL_SIZE + CELL_SIZE / 2;
  const targetY = member.y * CELL_SIZE + CELL_SIZE / 2;
  const containerRef = useRef<ContainerType>(null);
  const posRef = useRef({ x: targetX, y: targetY });
  const color = hashColor(member.agent_id);

  // Update target when member position changes
  const targetRef = useRef({ x: targetX, y: targetY });
  targetRef.current = { x: targetX, y: targetY };

  // Update position directly on the PixiJS container — no React state needed
  const tickCallback = useCallback((ticker: Ticker) => {
    const node = containerRef.current;
    if (!node) return;

    const curr = posRef.current;
    const target = targetRef.current;
    const lerpFactor = 1 - Math.pow(0.001, ticker.deltaTime / 60);

    const newX = curr.x + (target.x - curr.x) * lerpFactor;
    const newY = curr.y + (target.y - curr.y) * lerpFactor;

    if (Math.abs(newX - curr.x) > 0.01 || Math.abs(newY - curr.y) > 0.01) {
      posRef.current = { x: newX, y: newY };
      node.x = newX;
      node.y = newY;
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

  return (
    <pixiContainer ref={containerRef} x={posRef.current.x} y={posRef.current.y}>
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
