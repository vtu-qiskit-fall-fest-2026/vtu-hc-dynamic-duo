"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { MOCK_CBOM_DATA, CbomItem } from "@/lib/mock-cbom-data";
import { fetchAdaptedCbomInventory } from "@/lib/api";
import { Filter, ArrowUpRight } from "lucide-react";

interface HeatmapProps {
  items?: CbomItem[];
  onSelectAsset?: (asset: CbomItem) => void;
  selectedAssetId?: string | null;
}

export function QuantumRiskHeatmap({
  items: propItems,
  onSelectAsset,
  selectedAssetId,
}: HeatmapProps) {
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [apiItems, setApiItems] = useState<CbomItem[]>([]);

  useEffect(() => {
    if (!propItems) {
      fetchAdaptedCbomInventory().then((data) => {
        if (data && data.length > 0) setApiItems(data);
      });
    }
  }, [propItems]);

  const rawData = propItems ?? (apiItems.length > 0 ? apiItems : MOCK_CBOM_DATA);

  // Memoize data to prevent re-creation and re-rendering loops
  const scatterData = useMemo(() => {
    return rawData.filter((item) => {
      if (filterRisk === "ALL") return true;
      return item.riskCategory === filterRisk;
    }).map((item) => ({
      ...item,
      x: item.impactScore, // Impact Severity (1-10)
      y: item.exploitEase, // Ease of Exploitation (1-10)
      z: 1,
    }));
  }, [rawData, filterRisk]);

  const getColor = (item: CbomItem) => {
    if (item.riskCategory === "Shor's Vulnerable") {
      return "#dc2626"; // Critical Red
    }
    if (item.riskCategory === "Grover's Vulnerable") {
      return "#d97706"; // Amber
    }
    if (item.riskCategory === "Deprecated") {
      return "#ea580c"; // Orange
    }
    return "#059669"; // Emerald / Safe PQC
  };

  // Custom SVG Dot: Stable SVG rendering without CSS scale transforms that glitch relative to canvas origin
  const renderCustomDot = (props: any): React.ReactElement => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return <g />;
    const isSelected = selectedAssetId === payload.id;
    const color = getColor(payload);

    return (
      <g
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectAsset) {
            onSelectAsset(payload);
          }
        }}
      >
        {/* Generous invisible hit target to make tapping easy without jitter */}
        <circle cx={cx} cy={cy} r={14} fill="transparent" />

        {/* Selection indicator ring */}
        {isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="3 3"
            opacity={0.9}
          />
        )}

        {/* Main crisp circle */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 6.5 : 5.5}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1.75}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CbomItem = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-300 dark:border-slate-700 shadow-xl max-w-xs text-xs pointer-events-none select-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                data.riskCategory === "Shor's Vulnerable"
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                  : data.riskCategory === "Grover's Vulnerable"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              }`}
            >
              {data.riskCategory}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {data.id}
            </span>
          </div>

          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {data.assetName}
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate mb-2">
            {data.filePath}:{data.lineNumber}
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/80 p-2 rounded mb-2 font-mono">
            <div>
              <span className="text-slate-400 block text-[9px]">ALGORITHM</span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold">
                {data.currentAlgorithm}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">PQC TARGET</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {data.recommendedPqc}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>Impact: {data.impactScore}/10</span>
            <span>Exploit Ease: {data.exploitEase}/10</span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-end gap-1">
              Tap dot to inspect code diff <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-2xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Quantum Cryptographic Risk Matrix
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              NIST FIPS 203 Severity Map
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Plotting enterprise cryptographic assets by Impact Severity vs. Ease
            of Quantum Exploitation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {["ALL", "Shor's Vulnerable", "Grover's Vulnerable", "PQC Compliant"].map(
            (category) => (
              <button
                key={category}
                onClick={() => setFilterRisk(category)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                  filterRisk === category
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200 font-semibold"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                {category === "ALL" ? "All (12)" : category.split(" ")[0]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Heatmap Matrix Chart */}
      <div className="mt-4 relative">
        {/* Background Visual Zones Indicator */}
        <div className="absolute top-2 right-4 text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded pointer-events-none z-10 font-bold">
          CRITICAL ZONE: Hardcoded Asymmetric (RSA/ECC)
        </div>
        <div className="absolute bottom-10 left-16 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded pointer-events-none z-10 font-bold">
          SAFE ZONE: Hybrid / ML-KEM
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 25, left: 10 }}>
              {/* Quadrant Tinting */}
              <ReferenceArea
                x1={6.5}
                x2={10}
                y1={6.5}
                y2={10}
                fill="#fee2e2"
                fillOpacity={0.4}
              />
              <ReferenceArea
                x1={1}
                x2={5}
                y1={1}
                y2={5}
                fill="#dcfce7"
                fillOpacity={0.35}
              />
              <ReferenceArea
                x1={5}
                x2={7.5}
                y1={3.5}
                y2={7}
                fill="#fef3c7"
                fillOpacity={0.3}
              />

              <ReferenceLine x={5.5} stroke="#cbd5e1" strokeDasharray="3 3" />
              <ReferenceLine y={5.5} stroke="#cbd5e1" strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="x"
                name="Impact Severity"
                domain={[0, 10.5]}
                tickCount={6}
                tick={{ fontSize: 10, fill: "#64748b" }}
                label={{
                  value: "Impact Severity (Blast Radius & Data Shelf-Life) →",
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 11,
                  fill: "#64748b",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Ease of Exploitation"
                domain={[0, 10.5]}
                tickCount={6}
                tick={{ fontSize: 10, fill: "#64748b" }}
                label={{
                  value: "Ease of Quantum Exploitation (Shor/Grover) →",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  fontSize: 11,
                  fill: "#64748b",
                }}
              />
              <ZAxis type="number" dataKey="z" range={[140, 140]} />

              {/* Tooltip with pointerEvents none to prevent hover/click interference */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: "#94a3b8" }}
                wrapperStyle={{ pointerEvents: "none", zIndex: 40 }}
              />

              {/* Scatter with isAnimationActive={false} and custom SVG shape to eliminate jitter */}
              <Scatter
                data={scatterData}
                shape={renderCustomDot}
                isAnimationActive={false}
                onClick={(node: any) => {
                  const target = node?.payload || node;
                  if (target && onSelectAsset) {
                    onSelectAsset(target);
                  }
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            Critical (Shor's: RSA-2048, ECDSA)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Medium (Grover's: AES-128, 3DES)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Quantum Safe (ML-KEM / Hybrid)
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Hover for telemetry &bull; Tap dot to inspect code diff
        </div>
      </div>
    </div>
  );
}
