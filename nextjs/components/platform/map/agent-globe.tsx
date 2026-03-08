"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";

import {
  getAgentAvatarCellPosition,
  getAgentAvatarIdentity,
} from "@/lib/agent-avatar";
import { cn } from "@/lib/utils";
import type { AgentLocation } from "@/lib/data/agents";

const ReactGlobe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

const DARK_GLOBE_IMAGE_URL = "/images/globe/earth-dark.jpg";
const PULSE_GREEN = "#22c55e";
const PULSE_GREEN_FADE = "rgba(34, 197, 94, 0.18)";
const AUTO_ROTATE_SPEED = 0.45;
const AUTO_ROTATE_RESUME_DELAY_MS = 4000;

type GlobeThemeStyles = {
  border: string;
  popover: string;
  foreground: string;
  mutedForeground: string;
};

function formatLocation(location: AgentLocation) {
  return [location.city, location.country].filter(Boolean).join(", ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPointLabel(
  location: AgentLocation,
  themeStyles: GlobeThemeStyles,
) {
  const name = escapeHtml(location.name);
  const username = escapeHtml(`@${location.username}`);
  const summary = escapeHtml(formatLocation(location) || "Location unavailable");
  const avatar = getAgentAvatarIdentity(location.username);
  const avatarGlyph = avatar.cells
    .map((cell) => {
      const { x, y } = getAgentAvatarCellPosition(cell);
      return `<rect x="${x}" y="${y}" width="5" height="5" rx="1.4" fill="${avatar.foreground}" />`;
    })
    .join("");

  return `
    <div style="min-width: 168px; border: 1px solid ${themeStyles.border}; background: color-mix(in srgb, ${themeStyles.popover} 92%, transparent); padding: 10px; color: ${themeStyles.foreground}; font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif; backdrop-filter: blur(8px); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="display: flex; height: 24px; width: 24px; align-items: center; justify-content: center; border-radius: 9999px; background: ${avatar.background}; overflow: hidden;">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <g transform="rotate(${avatar.rotation} 12 12)">
              ${avatarGlyph}
            </g>
          </svg>
        </div>
        <div style="min-width: 0;">
          <div style="font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
          <div style="font-size: 11px; color: ${themeStyles.mutedForeground}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${username}</div>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 10px; color: ${themeStyles.mutedForeground}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${summary}
      </div>
    </div>
  `;
}

export function AgentGlobe({
  locations,
  className,
}: {
  locations: AgentLocation[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoRotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [size, setSize] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [themeStyles, setThemeStyles] = useState<GlobeThemeStyles>({
    border: "rgba(255,255,255,0.1)",
    popover: "rgba(0,0,0,0.92)",
    foreground: "#ffffff",
    mutedForeground: "rgba(255,255,255,0.68)",
  });

  const globeImageUrl = DARK_GLOBE_IMAGE_URL;

  const pointsData = useMemo(
    () =>
      locations.map((location) => ({
        ...location,
        label: buildPointLabel(location, themeStyles),
      })),
    [locations, themeStyles],
  );

  const clearAutoRotateTimeout = useCallback(() => {
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
      autoRotateTimeoutRef.current = null;
    }
  }, []);

  const scheduleAutoRotateResume = useCallback(() => {
    clearAutoRotateTimeout();
    autoRotateTimeoutRef.current = setTimeout(() => {
      const controls = globeRef.current?.controls();
      if (!controls) return;
      controls.autoRotate = true;
      controls.update();
      autoRotateTimeoutRef.current = null;
    }, AUTO_ROTATE_RESUME_DELAY_MS);
  }, [clearAutoRotateTimeout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = Math.floor(
        Math.min(entry.contentRect.width, window.innerHeight * 0.7),
      );
      setSize(nextSize);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [clearAutoRotateTimeout]);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);

    setThemeStyles({
      border: styles.getPropertyValue("--border").trim(),
      popover: styles.getPropertyValue("--popover").trim(),
      foreground: styles.getPropertyValue("--popover-foreground").trim(),
      mutedForeground: styles.getPropertyValue("--muted-foreground").trim(),
    });
  }, [resolvedTheme]);

  useEffect(() => {
    const globe = globeRef.current;
    const controls = globe?.controls();
    if (!globe || !controls) return;

    globe.resumeAnimation();
    controls.enabled = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 220;
    controls.maxDistance = 320;
    controls.update();
  }, [pathname, size, resolvedTheme]);

  useEffect(() => {
    const resumeGlobe = () => {
      const globe = globeRef.current;
      const controls = globe?.controls();
      if (!globe || !controls) return;

      globe.resumeAnimation();
      controls.enabled = true;
      controls.update();
    };

    window.addEventListener("pageshow", resumeGlobe);
    document.addEventListener("visibilitychange", resumeGlobe);

    return () => {
      setHoveredId(null);
      clearAutoRotateTimeout();
      window.removeEventListener("pageshow", resumeGlobe);
      document.removeEventListener("visibilitychange", resumeGlobe);
    };
  }, [clearAutoRotateTimeout]);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;

    const handleStart = () => {
      clearAutoRotateTimeout();
      controls.autoRotate = false;
      controls.update();
    };

    const handleEnd = () => {
      scheduleAutoRotateResume();
    };

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
    };
  }, [clearAutoRotateTimeout, scheduleAutoRotateResume, size, pathname, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={cn("relative mx-auto aspect-square w-full max-w-[40rem] overflow-hidden", className)}
    >
      {size > 0 ? (
        <ReactGlobe
          ref={globeRef}
          width={size}
          height={size}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={globeImageUrl}
          showAtmosphere={false}
          onGlobeReady={() => {
            const globe = globeRef.current;
            const controls = globe?.controls();
            if (!globe || !controls) return;

            globe.resumeAnimation();
            controls.enabled = true;
            controls.autoRotate = true;
            controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
            controls.enablePan = false;
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.minDistance = 220;
            controls.maxDistance = 320;
            controls.update();
          }}
          ringsData={pointsData}
          ringLat="latitude"
          ringLng="longitude"
          ringAltitude={0.01}
          ringColor={() => [PULSE_GREEN_FADE, PULSE_GREEN, PULSE_GREEN_FADE]}
          ringMaxRadius={1.2}
          ringPropagationSpeed={0.7}
          ringRepeatPeriod={1400}
          labelsData={pointsData}
          labelLat="latitude"
          labelLng="longitude"
          labelText={() => ""}
          labelLabel="label"
          labelAltitude={0.01}
          labelSize={0.01}
          labelIncludeDot={true}
          labelDotRadius={(point) =>
            (point as AgentLocation).id === hoveredId ? 0.64 : 0.48
          }
          labelColor={() => PULSE_GREEN}
          labelsTransitionDuration={150}
          onLabelHover={(point) =>
            setHoveredId(point ? (point as AgentLocation).id : null)
          }
          onLabelClick={(point) => {
            setHoveredId(null);
            router.push(`/agents/${(point as AgentLocation).username}`);
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 rounded-full border border-border/70" />
      <div className="pointer-events-none absolute inset-[12%] rounded-full border border-dashed border-border/60" />
      <div className="pointer-events-none absolute inset-[24%] rounded-full border border-border/40" />
    </div>
  );
}
