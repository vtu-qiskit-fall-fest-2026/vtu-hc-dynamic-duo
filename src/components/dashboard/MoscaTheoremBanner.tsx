"use client";

import React, { useState, useEffect } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  Info,
  Layers,
  Database,
  Lock,
} from "lucide-react";
import { CBOM_SUMMARY_STATS } from "@/lib/mock-cbom-data";
import { fetchDashboardSummary, DashboardSummary } from "@/lib/api";
import { BackendStatusBadge } from "@/components/common/BackendStatusBadge";

interface MoscaProps {
  onViewCbomClick?: () => void;
  onRemediateClick?: () => void;
}

export function MoscaTheoremBanner({
  onViewCbomClick,
  onRemediateClick,
}: MoscaProps) {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Fetch live data from backend, fall back to static defaults if offline
  useEffect(() => {
    fetchDashboardSummary().then((data) => {
      if (data) setSummary(data);
    });
  }, []);

  // Mosca parameters – prefer live backend values, else static defaults
  const X = summary?.mosca.data_shelf_life_years ?? 15;
  const Y = summary?.mosca.migration_horizon_years ?? 3;
  const Z = summary?.mosca.crqc_timeline_years ?? 7;
  const totalRequired = X + Y;
  const exposureDelta = Math.max(0, totalRequired - Z);

  const totalAssets    = summary?.total_assets ?? CBOM_SUMMARY_STATS.totalAssets;
  const shorCount      = summary?.shor_vulnerable_critical ?? CBOM_SUMMARY_STATS.shorVulnerable;
  const groverCount    = summary?.grover_vulnerable_medium ?? CBOM_SUMMARY_STATS.groverVulnerable;
  const migrationPct   = summary?.pqc_migration_progress ?? CBOM_SUMMARY_STATS.percentMigrated;
  const migratedCount  = summary?.pqc_migrated_count ?? 41;

  return (
    <div className="space-y-4">
      {/* Stark Enterprise Warning Banner */}
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900/70 rounded-lg p-4 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 bg-red-600 dark:bg-red-700 text-white rounded shrink-0 shadow-xs mt-0.5">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                  Mosca&apos;s Theorem: X + Y &gt; Z
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white uppercase tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Compromised Status: Active Exposure
                </span>
                <BackendStatusBadge />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                Harvest Now, Decrypt Later (HNDL) Threat In Effect
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Adversaries are actively harvesting encrypted ciphertexts from
                transit and storage. Your enterprise data confidentiality
                shelf-life (<span className="font-semibold text-slate-900 dark:text-white">{X} years</span>) plus migration horizon (<span className="font-semibold text-slate-900 dark:text-white">{Y} years</span>) exceeds the quantum timeline (<span className="font-semibold text-slate-900 dark:text-white">{Z} years to CRQC</span>).
                Deficit window: <span className="font-mono font-bold text-red-600 dark:text-red-400">+{exposureDelta} Years of Retrospective Exposure</span>.
              </p>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded transition"
            >
              {showFormulaDetails ? "Hide Theorem Math" : "Explain Math"}
            </button>
            <button
              onClick={onRemediateClick}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs transition flex items-center gap-1.5"
            >
              Remediate 142 Assets
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Progress / Timeline Comparison Bar */}
        <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/50">
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Security Threshold Timeline</span>
            <span className="font-semibold text-red-700 dark:text-red-400">
              18 Years Needed vs 7 Years Available (11 Yr Breach Horizon)
            </span>
          </div>

          {/* Segmented Timeline Comparison Bar */}
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded flex overflow-hidden border border-slate-300 dark:border-slate-700">
            {/* Safe Horizon Z */}
            <div
              style={{ width: `${(Z / totalRequired) * 100}%` }}
              className="bg-emerald-600 text-[10px] text-white font-mono flex items-center justify-center font-bold"
              title="Quantum Timeline Z = 7 years"
            >
              CRQC Horizon (7y)
            </div>
            {/* Deficit Exposure Zone */}
            <div
              style={{ width: `${(exposureDelta / totalRequired) * 100}%` }}
              className="bg-red-600 text-[10px] text-white font-mono flex items-center justify-center font-bold"
              title="Active Exposure Deficit = 11 years"
            >
              HNDL Compromised Zone (+11y)
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
            <span>Today (T=0)</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              CRQC Emergence (T+7y)
            </span>
            <span className="text-red-600 font-semibold">
              Data Secrecy Expiry (T+18y)
            </span>
          </div>
        </div>

        {/* Collapsible Math Card */}
        {showFormulaDetails && (
          <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Mosca's Theorem Derivation (Michele Mosca, University of Waterloo)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400">Parameter X (Data Shelf Life)</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  15 Years
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Legal retention for customer financial & health records
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400">Parameter Y (Migration Horizon)</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  3 Years
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Deployment of NIST FIPS 203/204 across microservices & TLS
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400">Parameter Z (Collapse Time)</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  7 Years
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Time until Cryptanalytically Relevant Quantum Computer
                </div>
              </div>
            </div>
            <div className="mt-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <strong>Theorem Conclusion:</strong> Because X + Y (18 yrs) &gt; Z
              (7 yrs), any ciphertext intercepted today will be broken before its
              confidentiality requirement expires. Migration must begin
              immediately to collapse Y to zero.
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Assets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Cryptographic Assets</span>
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {totalAssets.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-500">
              {summary?.monitored_repos_pods ?? 87} Repos / Pods
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Parsed from source code &amp; TLS endpoints
          </div>
        </div>

        {/* Card 2: Shor's Vulnerable (Critical) */}
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-medium">
            <span>Shor&apos;s Vulnerable (Critical)</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {shorCount}
            </span>
            <span className="text-[11px] font-mono font-bold text-red-600 px-1.5 py-0.5 bg-red-100 dark:bg-red-950/60 rounded">
              High Priority
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>RSA-2048, ECDSA, DH</span>
            <button
              onClick={onViewCbomClick}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-[10px]"
            >
              Filter CBOM &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Grover's Vulnerable */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
            <span>Grover&apos;s Vulnerable (Medium)</span>
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {groverCount}
            </span>
            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
              Effective 64-bit security
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            AES-128 &amp; SHA-256 (Upgrade to AES-256)
          </div>
        </div>

        {/* Card 4: PQC Migration Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>PQC Migration Progress</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {migrationPct}%
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {migratedCount} Migrated / {shorCount} Staged
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${migrationPct}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
