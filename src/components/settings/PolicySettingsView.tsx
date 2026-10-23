"use client";

import React, { useState, useEffect } from "react";
import {
  Settings2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Save,
  Check,
  RotateCw,
  Bell,
  Cpu,
} from "lucide-react";
import { fetchPolicyConfig, updatePolicyConfig, PolicyConfig } from "@/lib/api";
import { BackendStatusBadge } from "@/components/common/BackendStatusBadge";

export function PolicySettingsView() {
  const [fips203Enabled, setFips203Enabled] = useState(true);
  const [fips204Enabled, setFips204Enabled] = useState(true);
  const [blockShorMerge, setBlockShorMerge] = useState(true);
  const [cnsa2Timeline, setCnsa2Timeline] = useState("2030-strict");
  const [enforcementMode, setEnforcementMode] = useState("Strict");
  const [saved, setSaved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load active policy from backend on mount
  useEffect(() => {
    fetchPolicyConfig().then((policy) => {
      if (policy) {
        setFips203Enabled(policy.fips203_enabled);
        setFips204Enabled(policy.fips204_enabled);
        setBlockShorMerge(policy.block_shor_merges);
        setCnsa2Timeline(policy.cnsa2_timeline);
        setEnforcementMode(policy.enforcement_mode);
        if (policy.updated_at) setLastUpdated(policy.updated_at);
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const updated: PolicyConfig = {
      fips203_enabled: fips203Enabled,
      fips204_enabled: fips204Enabled,
      block_shor_merges: blockShorMerge,
      cnsa2_timeline: cnsa2Timeline,
      enforcement_mode: enforcementMode,
    };
    const res = await updatePolicyConfig(updated);
    setIsSaving(false);
    setSaved(true);
    if (res?.updated_at) setLastUpdated(res.updated_at);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cryptographic Policy & Compliance Settings
            </h2>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 font-semibold">
              Enforcement Mode: {enforcementMode}
            </span>
            <BackendStatusBadge />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated DevSecOps gates, NIST Post-Quantum standards, and
            NSA CNSA 2.0 mandate timelines.
            {lastUpdated && (
              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                Last synchronized: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-md transition shadow-xs flex items-center gap-1.5 self-start sm:self-center disabled:opacity-50"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Policies Saved & Synced" : isSaving ? "Saving..." : "Save Policies"}
        </button>
      </div>

      {/* NIST Standards Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          NIST Post-Quantum Cryptography Standard Enforcement
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* FIPS 203 */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                NIST FIPS 203: ML-KEM (Module-Lattice-Based Key-Encapsulation)
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Enforces ML-KEM-768 / ML-KEM-1024 on TLS 1.3 handshakes, API
                proxies, and database master key wrapping.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={fips203Enabled}
              onClick={() => setFips203Enabled(!fips203Enabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                fips203Enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                  fips203Enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* FIPS 204 */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                NIST FIPS 204: ML-DSA (Module-Lattice-Based Digital Signatures)
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Replaces ECDSA and RSA-PSS across JWT identity tokens, code
                signing certificates, and PKI trust chains.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={fips204Enabled}
              onClick={() => setFips204Enabled(!fips204Enabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                fips204Enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                  fips204Enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* CI/CD Gate */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Block Pull Request Merges on Shor-Vulnerable Primitives
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Fail CI/CD pipeline builds if new code introduces RSA, ECC
                (secp256r1), or Diffie-Hellman ciphers.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={blockShorMerge}
              onClick={() => setBlockShorMerge(!blockShorMerge)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                blockShorMerge ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                  blockShorMerge ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* NSA CNSA 2.0 Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          NSA Commercial National Security Algorithm Suite (CNSA 2.0)
        </h3>
        <p className="text-xs text-slate-500">
          U.S. Federal Government mandate requiring all national security systems
          and critical infrastructure to fully decommission classic public-key
          cryptography.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] pt-2">
          <div className="p-3 rounded border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
            <div className="font-bold text-blue-700 dark:text-blue-300">Phase 1 (2025-2026)</div>
            <div className="text-slate-600 dark:text-slate-400 mt-1">
              Hybrid deployment: Software and firmware code signing migration.
            </div>
          </div>
          <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200">Phase 2 (2027-2030)</div>
            <div className="text-slate-600 dark:text-slate-400 mt-1">
              Web browsers, servers, network equipment, operating systems.
            </div>
          </div>
          <div className="p-3 rounded border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30">
            <div className="font-bold text-red-700 dark:text-red-300">Phase 3 (2033 Full Cutoff)</div>
            <div className="text-slate-600 dark:text-slate-400 mt-1">
              Zero legacy crypto allowed. Classic RSA/ECC banned across federal contracts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
