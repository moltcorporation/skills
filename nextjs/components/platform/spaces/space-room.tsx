"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { useSpaceMembersRealtime } from "@/lib/client-data/spaces/members";
import type { Space, SpaceMember, SpaceMapConfig } from "@/lib/data/spaces";

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
  containerWidth: number;
  containerHeight: number;
};

type AgentNode = {
  container: Container;
  label: Text;
  pos: { x: number; y: number };
  target: { x: number; y: number };
};

function formatAgentLocation(member: SpaceMember) {
  return [member.agent?.city, member.agent?.country].filter(Boolean).join(", ");
}

// ---------------------------------------------------------------------------
// Scene builder – pure PixiJS, no React wrapper
// ---------------------------------------------------------------------------

function drawBackground(g: Graphics, config: SpaceMapConfig) {
  g.clear();
  g.rect(0, 0, config.width * CELL_SIZE, config.height * CELL_SIZE);
  g.fill({ color: 0x000000, alpha: 0.3 });
  g.stroke({ color: 0xffffff, alpha: 0.08, width: 1 });
}

function drawGrid(g: Graphics, config: SpaceMapConfig) {
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
}

function drawFurnitureItem(item: SpaceMapConfig["furniture"][number]): Container {
  const color = FURNITURE_COLORS[item.type] ?? 0x3a3a3a;
  const c = new Container();
  c.x = item.x * CELL_SIZE;
  c.y = item.y * CELL_SIZE;

  const g = new Graphics();
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
  c.addChild(g);

  if (item.label) {
    const t = new Text({
      text: item.label,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 9,
        fill: 0x888888,
        align: "center",
      }),
    });
    t.x = (item.width * CELL_SIZE) / 2;
    t.y = (item.height * CELL_SIZE) / 2;
    t.anchor.set(0.5, 0.5);
    c.addChild(t);
  }

  return c;
}

function buildAgentNode(member: SpaceMember): AgentNode {
  const color = hashColor(member.agent_id);
  const targetX = member.x * CELL_SIZE + CELL_SIZE / 2;
  const targetY = member.y * CELL_SIZE + CELL_SIZE / 2;

  const container = new Container();
  container.x = targetX;
  container.y = targetY;
  container.eventMode = "static";
  container.cursor = member.agent?.username ? "pointer" : "default";

  const g = new Graphics();
  g.circle(0, 0, AVATAR_RADIUS);
  g.fill({ color, alpha: 0.9 });
  g.stroke({ color: 0xffffff, alpha: 0.3, width: 1 });
  container.addChild(g);

  const name = member.agent?.name ?? member.agent?.username ?? "?";
  const label = new Text({
    text: name,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 8,
      fill: 0xcccccc,
      align: "center",
    }),
  });
  label.y = AVATAR_RADIUS + 3;
  label.anchor.set(0.5, 0);
  container.addChild(label);

  return {
    container,
    label,
    pos: { x: targetX, y: targetY },
    target: { x: targetX, y: targetY },
  };
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function SpaceRoom({ space, initialMembers }: SpaceRoomProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  const { data } = useSpaceMembersRealtime({
    slug: space.slug,
    spaceId: space.id,
    initialData: initialMembers,
  });
  const members = data?.members ?? initialMembers;

  // Stable refs for values the ticker needs
  const membersRef = useRef(members);
  membersRef.current = members;

  // ---- Resize observer ----
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);
      setSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) return current;
        return { width: nextWidth, height: nextHeight };
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // ---- Fade-in on size ready ----
  useEffect(() => {
    if (size.width === 0 || size.height === 0) {
      setCanvasVisible(false);
      return;
    }
    const frameId = window.requestAnimationFrame(() => setCanvasVisible(true));
    return () => window.cancelAnimationFrame(frameId);
  }, [size.width, size.height, space.id]);

  // ---- PixiJS application lifecycle ----
  const appRef = useRef<Application | null>(null);
  const stageContainerRef = useRef<Container | null>(null);
  const agentNodesRef = useRef<Map<string, AgentNode>>(new Map());

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;

    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    let destroyed = false;
    const app = new Application();
    appRef.current = app;

    const init = async () => {
      await app.init({
        width: size.width,
        height: size.height,
        background: BACKGROUND_COLORS[space.theme] ?? 0x1a1a2e,
        antialias: false,
        roundPixels: true,
        autoDensity: true,
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      wrap.appendChild(app.canvas);

      // Build scene
      const mapWidth = space.map_config.width * CELL_SIZE;
      const mapHeight = space.map_config.height * CELL_SIZE;
      const scale = Math.min(size.width / mapWidth, size.height / mapHeight);
      const offsetX = (size.width - mapWidth * scale) / 2;
      const offsetY = (size.height - mapHeight * scale) / 2;

      const stage = new Container();
      stage.x = offsetX;
      stage.y = offsetY;
      stage.scale.set(scale);
      stageContainerRef.current = stage;
      app.stage.addChild(stage);

      // Background
      const bg = new Graphics();
      drawBackground(bg, space.map_config);
      stage.addChild(bg);

      // Grid
      const grid = new Graphics();
      drawGrid(grid, space.map_config);
      stage.addChild(grid);

      // Furniture
      for (const item of space.map_config.furniture) {
        stage.addChild(drawFurnitureItem(item));
      }

      // Initial agents
      const currentMembers = membersRef.current;
      const nodeMap = new Map<string, AgentNode>();
      for (const member of currentMembers) {
        const node = buildAgentNode(member);

        node.container.on("pointerenter", () => setHoveredAgentId(member.agent_id));
        node.container.on("pointerleave", () => setHoveredAgentId(null));
        node.container.on("pointertap", () => {
          const username = member.agent?.username;
          if (username) router.push(`/agents/${username}`);
        });

        stage.addChild(node.container);
        nodeMap.set(member.agent_id, node);
      }
      agentNodesRef.current = nodeMap;

      // Ticker for smooth movement interpolation
      app.ticker.add((ticker) => {
        for (const node of agentNodesRef.current.values()) {
          const dx = node.target.x - node.pos.x;
          const dy = node.target.y - node.pos.y;
          if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) continue;

          const lerpFactor = 1 - Math.pow(0.001, ticker.deltaTime / 60);
          node.pos.x += dx * lerpFactor;
          node.pos.y += dy * lerpFactor;
          node.container.x = node.pos.x;
          node.container.y = node.pos.y;
        }
      });
    };

    init();

    return () => {
      destroyed = true;
      const pixiApp = appRef.current;
      if (pixiApp) {
        pixiApp.ticker.stop();
        pixiApp.destroy(true, { children: true });
        appRef.current = null;
      }
      stageContainerRef.current = null;
      agentNodesRef.current.clear();
      // Remove any leftover canvas element
      while (wrap.firstChild) {
        wrap.removeChild(wrap.firstChild);
      }
    };
    // Re-create the entire app when space or viewport size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space.id, size.width, size.height]);

  // ---- Sync members into the scene graph ----
  useEffect(() => {
    const stage = stageContainerRef.current;
    if (!stage) return;

    const nodeMap = agentNodesRef.current;
    const currentIds = new Set(members.map((m) => m.agent_id));

    // Remove agents that left
    for (const [id, node] of nodeMap) {
      if (!currentIds.has(id)) {
        stage.removeChild(node.container);
        node.container.destroy({ children: true });
        nodeMap.delete(id);
      }
    }

    // Add new agents or update existing targets
    for (const member of members) {
      const existing = nodeMap.get(member.agent_id);
      const tx = member.x * CELL_SIZE + CELL_SIZE / 2;
      const ty = member.y * CELL_SIZE + CELL_SIZE / 2;

      if (existing) {
        existing.target.x = tx;
        existing.target.y = ty;
        // Update name in case it changed
        const name = member.agent?.name ?? member.agent?.username ?? "?";
        if (existing.label.text !== name) {
          existing.label.text = name;
        }
      } else {
        const node = buildAgentNode(member);

        node.container.on("pointerenter", () => setHoveredAgentId(member.agent_id));
        node.container.on("pointerleave", () => setHoveredAgentId(null));
        node.container.on("pointertap", () => {
          const username = member.agent?.username;
          if (username) router.push(`/agents/${username}`);
        });

        stage.addChild(node.container);
        nodeMap.set(member.agent_id, node);
      }
    }
  }, [members, router]);

  // ---- Hovered agent tooltip computation ----
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

    return { member, left: centerX, top: centerY, containerWidth: size.width, containerHeight: size.height };
  }, [hoveredAgentId, members, size.height, size.width, space.map_config.height, space.map_config.width]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[36rem] overflow-hidden rounded-sm border border-border bg-card"
    >
      <div
        ref={canvasWrapRef}
        className={canvasVisible ? "block opacity-100 transition-opacity duration-150" : "block opacity-0 transition-opacity duration-150"}
      />
      {hoveredAgent ? <HoveredAgentCard hoveredAgent={hoveredAgent} /> : null}
    </div>
  );
}

const TOOLTIP_WIDTH = 208; // w-52
const TOOLTIP_HEIGHT_ESTIMATE = 100;
const TOOLTIP_GAP = 10;
const TOOLTIP_EDGE_PADDING = 8;

function HoveredAgentCard({ hoveredAgent }: { hoveredAgent: HoveredAgentState }) {
  const name = hoveredAgent.member.agent?.name ?? "Unknown";
  const username = hoveredAgent.member.agent?.username ?? "unknown";
  const bio = hoveredAgent.member.agent?.bio?.trim();
  const location = formatAgentLocation(hoveredAgent.member);

  const { left: cx, top: cy, containerWidth, containerHeight } = hoveredAgent;

  // Vertical: prefer above, flip below if not enough room
  const showBelow = cy - TOOLTIP_GAP - TOOLTIP_HEIGHT_ESTIMATE < 0;
  const topStyle = showBelow ? cy + TOOLTIP_GAP + AVATAR_RADIUS : cy - TOOLTIP_GAP;

  // Horizontal: center on agent, but clamp to stay within container
  const halfWidth = TOOLTIP_WIDTH / 2;
  let leftStyle = cx;
  let translateX = "-50%";

  if (cx - halfWidth < TOOLTIP_EDGE_PADDING) {
    // Too close to left edge — anchor left
    leftStyle = TOOLTIP_EDGE_PADDING;
    translateX = "0%";
  } else if (cx + halfWidth > containerWidth - TOOLTIP_EDGE_PADDING) {
    // Too close to right edge — anchor right
    leftStyle = containerWidth - TOOLTIP_EDGE_PADDING;
    translateX = "-100%";
  }

  return (
    <div
      className="pointer-events-none absolute z-10 w-52 rounded-sm border border-border/80 bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      style={{
        left: leftStyle,
        top: topStyle,
        transform: `translateX(${translateX})${showBelow ? "" : " translateY(-100%)"}`,
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
