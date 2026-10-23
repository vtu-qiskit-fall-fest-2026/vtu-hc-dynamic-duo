"use client";

import React, { useState, useEffect } from "react";
import { Search, X, FileCode2, ArrowRight, ShieldAlert, Activity, GitPullRequest } from "lucide-react";
import { MOCK_CBOM_DATA, CbomItem } from "@/lib/mock-cbom-data";
import { fetchAdaptedCbomInventory } from "@/lib/api";
import { NavView } from "../layout/Sidebar";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: CbomItem) => void;
  onNavigate: (view: NavView) => void;
}

export function QuickSearchModal({
  isOpen,
  onClose,
  onSelectAsset,
  onNavigate,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CbomItem[]>(MOCK_CBOM_DATA);

  useEffect(() => {
    if (isOpen) {
      fetchAdaptedCbomInventory().then((data) => {
        if (data && data.length > 0) setItems(data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle or open
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredAssets = query
    ? items.filter(
        (a) =>
          a.assetName.toLowerCase().includes(query.toLowerCase()) ||
          a.currentAlgorithm.toLowerCase().includes(query.toLowerCase()) ||
          a.filePath.toLowerCase().includes(query.toLowerCase()) ||
          a.service.toLowerCase().includes(query.toLowerCase())
      )
    : items.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in-90 zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CBOM dependencies, algorithms (RSA, ML-KEM), views..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Quick Nav Suggestions */}
        {!query && (
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="text-[10px] uppercase font-mono text-slate-400 px-2 py-1 font-semibold">
              Quick Views
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => {
                  onNavigate("cbom");
                  onClose();
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <FileCode2 className="w-3.5 h-3.5 text-blue-500" />
                <span>CBOM Inventory (142 Vulns)</span>
              </button>
              <button
                onClick={() => {
                  onNavigate("qkd-simulator");
                  onClose();
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>QKD BB84 Simulator Lab</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="text-[10px] uppercase font-mono text-slate-400 px-2 py-1 font-semibold">
            {query ? `Matching Cryptographic Primitives (${filteredAssets.length})` : "Recent High-Risk Primitives"}
          </div>
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => {
                onSelectAsset(asset);
                onClose();
              }}
              className="p-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition"
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{asset.assetName}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      asset.riskCategory === "Shor's Vulnerable"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    }`}
                  >
                    {asset.currentAlgorithm}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {asset.filePath} &bull; Target: {asset.recommendedPqc}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
