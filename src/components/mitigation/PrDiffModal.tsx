"use client";

import React, { useState } from "react";
import { MitigationPR } from "@/lib/mock-prs-data";
import {
  X,
  GitPullRequest,
  CheckCircle2,
  GitMerge,
  Copy,
  Check,
  FileCode,
  Shield,
  Layers,
} from "lucide-react";

interface DiffModalProps {
  pr: MitigationPR | null;
  onClose: () => void;
  onMerge: (prId: string) => void;
}

export function PrDiffModal({ pr, onClose, onMerge }: DiffModalProps) {
  const [copied, setCopied] = useState(false);

  if (!pr) return null;

  const copyDiff = () => {
    navigator.clipboard.writeText(pr.unifiedDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  #{pr.prNumber}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  {pr.repo}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  {pr.nistCompliance}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {pr.title}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">BRANCH</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {pr.branch}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                REPLACED CIPHER
              </span>
              <span className="text-red-600 dark:text-red-400 font-bold truncate block">
                {pr.vulnerableCipher}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                TARGET STANDARD
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {pr.migratedCipher}
              </span>
            </div>
          </div>

          <div className="text-slate-600 dark:text-slate-300 text-xs">
            {pr.diffSummary}
          </div>

          {/* Diff Box */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                Unified Git Patch Diff:
              </span>
              <button
                onClick={copyDiff}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy Diff"}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-200 p-3.5 rounded-md font-mono text-[11px] overflow-x-auto border border-slate-800 select-text leading-relaxed">
              <pre>
                {pr.unifiedDiff.split("\n").map((line, idx) => {
                  let lineStyle = "text-slate-300";
                  if (line.startsWith("+"))
                    lineStyle = "text-emerald-400 bg-emerald-950/40";
                  if (line.startsWith("-"))
                    lineStyle = "text-red-400 bg-red-950/40";
                  if (line.startsWith("@"))
                    lineStyle = "text-blue-400 font-bold";
                  return (
                    <div key={idx} className={`${lineStyle} px-1`}>
                      {line}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pre-commit crypto-linter checks passed (CI Passing)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded transition"
            >
              Cancel
            </button>
            {pr.status !== "Merged" && (
              <button
                onClick={() => {
                  onMerge(pr.id);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-1.5 shadow-xs"
              >
                <GitMerge className="w-3.5 h-3.5" />
                Merge & Enforce FIPS PQC
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
