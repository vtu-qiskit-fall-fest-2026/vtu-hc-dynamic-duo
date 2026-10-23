"use client";

import React from "react";
import {
  LayoutDashboard,
  FileCode2,
  GitPullRequest,
  Activity,
  Settings2,
  Shield,
  Layers,
  Terminal,
  ExternalLink,
  ChevronRight,
  Radio,
} from "lucide-react";

export type NavView =
  | "dashboard"
  | "cbom"
  | "mitigation"
  | "qkd-simulator"
  | "settings";

interface SidebarProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  openPrsCount?: number;
  criticalCbomCount?: number;
}

export function Sidebar({
  currentView,
  onViewChange,
  openPrsCount = 2,
  criticalCbomCount = 142,
}: SidebarProps) {
  const navItems = [
    {
      id: "dashboard" as NavView,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      description: "Overview & Mosca Risk",
    },
    {
      id: "cbom" as NavView,
      label: "CBOM Inventory",
      icon: FileCode2,
      badge: `${criticalCbomCount}`,
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-900",
      description: "Cryptographic Bill of Materials",
    },
    {
      id: "mitigation" as NavView,
      label: "Mitigation PRs",
      icon: GitPullRequest,
      badge: `${openPrsCount} Open`,
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-900",
      description: "Zero-Code Remediation",
    },
    {
      id: "qkd-simulator" as NavView,
      label: "QKD Simulator",
      icon: Activity,
      badge: "BB84",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900",
      description: "Quantum Channel Telemetry",
    },
    {
      id: "settings" as NavView,
      label: "Settings",
      icon: Settings2,
      badge: null,
      description: "FIPS 203/204 Policies",
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none transition-colors">
      <div className="p-3">
        {/* Workspace Brand / Product Title */}
        <div className="px-2.5 py-3 mb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-slate-100 shadow-sm border border-slate-700">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Q-SHIELD
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Post-Quantum DevSecOps
              </div>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Core Navigation
        </div>

        {/* Nav Items */}
        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border-l-2 border-blue-600"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Channel Status Box */}
        <div className="mt-6 mx-1 p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              Quantum Channel Link
            </span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              UP (0.24 dB/km)
            </span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
            BB84 Alice ↔ Bob Dark Fiber #04 • Target: 11.0% Max QBER
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
            <Terminal className="w-3 h-3" />
            NIST FIPS 203/204/205
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
            v2.4.1
          </span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Cryptographic Bill of Materials (CBOM) compliant with CycloneDX 1.6 &
          SPDX 3.0.
        </div>
      </div>
    </aside>
  );
}
