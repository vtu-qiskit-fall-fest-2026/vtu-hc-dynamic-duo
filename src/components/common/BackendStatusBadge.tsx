"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Wifi, WifiOff } from "lucide-react";
import { checkBackendHealth } from "@/lib/api";

/** Shared context for backend connectivity status, re-exported for optional use. */
export function BackendStatusBadge() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkBackendHealth().then((ok) => { if (!cancelled) setOnline(ok); });
    const id = setInterval(() => {
      checkBackendHealth().then((ok) => { if (!cancelled) setOnline(ok); });
    }, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (online === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded border ${
        online
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
      }`}
      title={online ? "FastAPI backend connected" : "Running on static data (backend offline)"}
    >
      {online ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
      {online ? "Live API" : "Offline Mode"}
    </span>
  );
}
