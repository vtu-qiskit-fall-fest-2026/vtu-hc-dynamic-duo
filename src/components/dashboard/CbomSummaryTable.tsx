"use client";

import React, { useState, useEffect } from "react";
import { MOCK_CBOM_DATA, CbomItem } from "@/lib/mock-cbom-data";
import { fetchAdaptedCbomInventory } from "@/lib/api";
import {
  FileCode2,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  GitPullRequest,
  Lock,
} from "lucide-react";

interface CbomSummaryProps {
  onSelectAsset: (asset: CbomItem) => void;
  onViewAllCbom?: () => void;
}

export function CbomSummaryTable({
  onSelectAsset,
  onViewAllCbom,
}: CbomSummaryProps) {
  const [items, setItems] = useState<CbomItem[]>(MOCK_CBOM_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  useEffect(() => {
    fetchAdaptedCbomInventory().then((data) => {
      if (data && data.length > 0) setItems(data);
    });
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.currentAlgorithm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      riskFilter === "ALL" || item.riskCategory === riskFilter;

    return matchesSearch && matchesRisk;
  }).slice(0, 6); // Top 6 items on dashboard view

  const getRiskBadge = (category: CbomItem["riskCategory"]) => {
    switch (category) {
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-2xs">
      {/* Table Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              CBOM Inventory: Cryptographic Dependencies
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              CycloneDX 1.6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic primitives parsed from Git repositories, AST signatures,
            and TLS endpoints.
          </p>
        </div>

        {/* Quick Search & Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter dependencies..."
              className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="Shor's Vulnerable">Shor's Vulnerable</option>
            <option value="Grover's Vulnerable">Grover's Vulnerable</option>
            <option value="PQC Compliant">PQC Compliant</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              <th className="py-2.5 px-3">Dependency Name</th>
              <th className="py-2.5 px-3">File Path / Endpoint</th>
              <th className="py-2.5 px-3">Current Algorithm</th>
              <th className="py-2.5 px-3">Risk Category</th>
              <th className="py-2.5 px-3">Recommended PQC Standard</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectAsset(item)}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-xs">
                    <span className="truncate max-w-[200px]" title={item.assetName}>
                      {item.assetName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {item.service} &bull; {item.locationType}
                  </div>
                </td>

                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 hover:underline">
                    {item.filePath}
                  </span>
                  <span className="text-slate-400">:{item.lineNumber}</span>
                </td>

                <td className="py-2.5 px-3">
                  <span
                    className={`font-semibold ${
                      item.riskCategory === "Shor's Vulnerable"
                        ? "text-red-600 dark:text-red-400"
                        : item.riskCategory === "Grover's Vulnerable"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {item.currentAlgorithm}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.keyLength}
                  </span>
                </td>

                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskBadge(
                      item.riskCategory
                    )}`}
                  >
                    {item.riskCategory}
                  </span>
                </td>

                <td className="py-2.5 px-3">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                    {item.recommendedPqc}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.pqcStandard}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset(item);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] font-mono">
          Showing {filteredItems.length} of {MOCK_CBOM_DATA.length} scanned primitives
        </span>
        {onViewAllCbom && (
          <button
            onClick={onViewAllCbom}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 text-[11px]"
          >
            Open full CBOM inventory &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
