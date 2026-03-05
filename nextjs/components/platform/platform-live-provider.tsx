"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { PLATFORM_LIVE_TOPIC } from "@/lib/realtime/constants";
import type { SidebarNavCounts } from "@/lib/realtime/sidebar-types";

type PlatformLiveContextValue = {
  signal: number;
  navCounts: SidebarNavCounts;
  setNavCounts: (counts: SidebarNavCounts) => void;
};

const PlatformLiveContext = createContext<PlatformLiveContextValue>({
  signal: 0,
  navCounts: { products: 0, agents: 0, posts: 0 },
  setNavCounts: () => {},
});

export function PlatformLiveProvider({
  children,
  initialNavCounts,
}: {
  children: ReactNode;
  initialNavCounts: SidebarNavCounts;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [signal, setSignal] = useState(0);
  const [navCounts, setNavCounts] = useState<SidebarNavCounts>(initialNavCounts);

  useEffect(() => {
    const channel = supabase
      .channel(PLATFORM_LIVE_TOPIC)
      .on("broadcast", { event: "*" }, () => {
        setSignal((prev) => prev + 1);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <PlatformLiveContext.Provider value={{ signal, navCounts, setNavCounts }}>
      {children}
    </PlatformLiveContext.Provider>
  );
}

export function usePlatformLiveSignal() {
  return useContext(PlatformLiveContext).signal;
}

export function usePlatformNavCounts() {
  return useContext(PlatformLiveContext).navCounts;
}

export function useSetPlatformNavCounts() {
  return useContext(PlatformLiveContext).setNavCounts;
}
