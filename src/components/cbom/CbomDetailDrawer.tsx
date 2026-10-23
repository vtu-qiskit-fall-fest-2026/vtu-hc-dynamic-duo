"use client";

import React, { useState } from "react";
import { CbomItem } from "@/lib/mock-cbom-data";
import {
  X,
  ShieldAlert,
  FileCode2,
  Copy,
  Check,
  GitPullRequest,
  Box,
  ExternalLink,
  Layers,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { postRemediatePr, postRemediateProxy } from "@/lib/api";

interface DrawerProps {
  asset: CbomItem | null;
  onClose: () => void;
  onDeploySidecar?: (asset: CbomItem) => void;
  onGeneratePr?: (asset: CbomItem) => void;
}

export function CbomDetailDrawer({
  asset,
  onClose,
  onDeploySidecar,
  onGeneratePr,
}: DrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!asset) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setActionMessage("Deploying Envoy PQC Hybrid Sidecar...");
    const res = await postRemediateProxy({
      target_service: asset.service,
      pod_name: `${asset.service}-pod`,
      cluster_name: "prod-us-east-1",
      hybrid_kex: "X25519_MLKEM768",
    });
    setIsDeploying(false);
    if (res) {
      setActionMessage(`Sidecar Injected! Secret: ${res.derived_shared_secret_prefix}`);
      setTimeout(() => {
        if (onDeploySidecar) onDeploySidecar(asset);
        onClose();
      }, 1500);
    } else {
      if (onDeploySidecar) onDeploySidecar(asset);
      onClose();
    }
  };

  const handleGeneratePr = async () => {
    setIsGenerating(true);
    setActionMessage("Synthesizing PQC patch via Groq llama3-70b-8192...");
    const res = await postRemediatePr({
      file_path: asset.filePath,
      repo: asset.repo,
      target_pqc: asset.recommendedPqc,
    });
    setIsGenerating(false);
    if (res) {
      setActionMessage(`PR #${res.pr_number} created on branch ${res.branch}!`);
      setTimeout(() => {
        if (onGeneratePr) onGeneratePr(asset);
        onClose();
      }, 1200);
    } else {
      if (onGeneratePr) onGeneratePr(asset);
      onClose();
    }
  };

  const getRiskBadge = (risk: CbomItem["riskCategory"]) => {
    switch (risk) {
      case "Shor's Vulnerable":
        return "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 border border-red-200 dark:border-red-900";
      case "Grover's Vulnerable":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-900";
      case "Deprecated":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-400 border border-orange-200 dark:border-orange-900";
      default:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900";
    }
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  {asset.id}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getRiskBadge(
                    asset.riskCategory
                  )}`}
                >
                  {asset.riskCategory}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {asset.assetName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">
                REPOSITORY / SERVICE
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {asset.repo} &bull; {asset.service}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                FILE PATH & LINE
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium truncate block">
                {asset.filePath}:{asset.lineNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                CURRENT ALGORITHM
              </span>
              <span className="text-red-600 dark:text-red-400 font-bold">
                {asset.currentAlgorithm} ({asset.keyLength})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                RECOMMENDED PQC
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {asset.recommendedPqc} ({asset.pqcStandard})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                LOCATION TYPE
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {asset.locationType}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                DATA CONFIDENTIALITY SHELF-LIFE
              </span>
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3 text-slate-400" />
                {asset.dataShelfLifeYears} Years Retention
              </span>
            </div>
          </div>

          {/* Vulnerability Explanation */}
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
            <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              Shor's Algorithm Threat Breakdown
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              This asset employs asymmetric integer factorization or discrete
              logarithm primitives. A cryptanalytically relevant quantum computer
              running Shor's algorithm will solve this key in polynomial time:{" "}
              <code className="bg-red-100 dark:bg-red-900/60 px-1 py-0.5 rounded text-red-800 dark:text-red-300">
                O((log N)^3)
              </code>
              . Any encrypted payloads intercepted and archived today under HNDL
              will face complete plaintext exposure.
            </p>
          </div>

          {/* Vulnerable Source Code Box */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Vulnerable Source Code Detected:
              </span>
              <span className="text-slate-400 text-[10px]">
                Line {asset.lineNumber}
              </span>
            </div>
            <div className="bg-slate-950 text-slate-200 p-3 rounded-md font-mono text-[11px] overflow-x-auto border border-slate-800">
              <pre>{asset.codeSnippet}</pre>
            </div>
          </div>

          {/* Remediated PQC Code Box */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                NIST FIPS Recommended Remediation:
              </span>
              <button
                onClick={() => copyCode(asset.remediationSnippet)}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy Snippet"}
              </button>
            </div>
            <div className="bg-slate-950 text-emerald-300 p-3 rounded-md font-mono text-[11px] overflow-x-auto border border-slate-800">
              <pre>{asset.remediationSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Action message banner if active */}
        {actionMessage && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/70 border-t border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-mono text-xs flex items-center gap-2">
            {(isDeploying || isGenerating) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Drawer Actions Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded transition"
          >
            Close Inspector
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeploy}
              disabled={isDeploying || isGenerating}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Box className="w-3.5 h-3.5" />}
              {isDeploying ? "Deploying..." : "Deploy Sidecar"}
            </button>
            <button
              onClick={handleGeneratePr}
              disabled={isDeploying || isGenerating}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitPullRequest className="w-3.5 h-3.5" />}
              {isGenerating ? "Generating PR..." : "Generate PQC Pull Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
