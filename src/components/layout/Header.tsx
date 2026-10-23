"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ChevronDown,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sun,
  Moon,
  ExternalLink,
  Lock,
} from "lucide-react";
import { BackendStatusBadge } from "@/components/common/BackendStatusBadge";

interface HeaderProps {
  currentEnv: string;
  onEnvChange: (env: string) => void;
  onOpenSearch?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ENVIRONMENTS = [
  {
    id: "prod-us-east-1",
    name: "prod-us-east-1 (AWS EKS)",
    tag: "Production",
    assets: 3120,
    status: "Active Exposure",
  },
  {
    id: "prod-eu-west-1",
    name: "prod-eu-west-1 (FinTech Mesh)",
    tag: "Production",
    assets: 1420,
    status: "Active Exposure",
  },
  {
    id: "staging-hybrid",
    name: "staging-hybrid (OQS Testbed)",
    tag: "Staging",
    assets: 281,
    status: "Mitigated (92%)",
  },
];

export function Header({
  currentEnv,
  onEnvChange,
  onOpenSearch,
  isDarkMode,
  onToggleDarkMode,
}: HeaderProps) {
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const selectedEnv =
    ENVIRONMENTS.find((e) => e.id === currentEnv) || ENVIRONMENTS[0];

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Environment Selector & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-mono tracking-tight font-bold text-sm">
            <Lock className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            Q-SHIELD
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="hidden sm:inline">Organization:</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Federal-Reserve-Demo-Org
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
        </div>

        {/* Global Environment Switcher */}
        <div className="relative">
          <button
            onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded text-xs font-medium border border-slate-300/70 dark:border-slate-700 transition"
          >
            <Server className="w-3 h-3 text-slate-500" />
            <span className="font-mono text-xs font-semibold">
              {selectedEnv.name}
            </span>
            <span className="inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
              {selectedEnv.tag}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {envDropdownOpen && (
            <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Switch Scanned Cluster
              </div>
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env.id}
                  onClick={() => {
                    onEnvChange(env.id);
                    setEnvDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                    env.id === currentEnv
                      ? "bg-slate-100 dark:bg-slate-800/80 font-medium"
                      : ""
                  }`}
                >
                  <div>
                    <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {env.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {env.assets} crypto endpoints • {env.status}
                    </div>
                  </div>
                  {env.id === currentEnv && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Search / Command Trigger */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1 bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded text-xs text-slate-500 dark:text-slate-400 transition"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search CBOM keys, algorithms, CVEs...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Security Status, Notifications, Dark Mode & Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Compliance Tag */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded text-xs text-emerald-800 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono font-medium">NIST FIPS 203/204 Enforced</span>
        </div>

        <BackendStatusBadge />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-xl py-2 z-50 text-xs">
              <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Security Alerts (3)
                </span>
                <span className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline">
                  Mark read
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Critical HNDL Exposure
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Customer PII Database wrapped with RSA-2048 exceeds quantum timeline by 11 yrs.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        BB84 QKD Anomaly Triggered
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        QBER exceeded 11.0% limit on Fiber Link #3. Auto-sifting aborted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isDarkMode ? "Switch to Enterprise Light" : "Switch to Slate Dark"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded bg-slate-800 dark:bg-slate-700 text-white font-mono text-xs flex items-center justify-center font-bold">
            ER
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
              Dr. E. Rostova
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              FedRAMP SecOps
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
