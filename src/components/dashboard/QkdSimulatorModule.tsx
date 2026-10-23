"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  generateInitialQkdData,
  QkdDataPoint,
  INITIAL_TELEMETRY,
} from "@/lib/mock-qkd-data";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Radio,
  RotateCw,
  Pause,
  Play,
  Cpu,
  ZapOff,
} from "lucide-react";
import { connectQkdWebSocket, disconnectQkdWebSocket, sendWsEveToggle, QkdSimulateResponse } from "@/lib/api";

interface QkdProps {
  onOpenDeepView?: () => void;
}

export function QkdSimulatorModule({ onOpenDeepView }: QkdProps) {
  const [data, setData] = useState<QkdDataPoint[]>([]);
  const [eveActive, setEveActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentQber, setCurrentQber] = useState<number>(1.85);
  const [purgedKeyCounter, setPurgedKeyCounter] = useState<number>(0);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize data on mount (avoid hydration mismatch)
  useEffect(() => {
    setData(generateInitialQkdData());
  }, []);

  // Attempt WebSocket connection to backend
  useEffect(() => {
    const ws = connectQkdWebSocket({
      onOpen: () => {
        setBackendConnected(true);
      },
      onMessage: (frame: QkdSimulateResponse) => {
        if (isPaused) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          hour12: false,
          minute: "2-digit",
          second: "2-digit",
        });
        const newPoint: QkdDataPoint = {
          time: timeStr,
          qber: frame.live_qber,
          threshold: frame.threshold_qber,
          rawKeyRate: frame.raw_key_rate_kbps,
          siftedKeyRate: frame.sifted_key_rate_kbps,
          status: frame.channel_state.includes("COMPROMISED") ? "COMPROMISED" : "SECURE",
          detectedPhotons: Math.round(48000 + Math.random() * 1200),
          basisMatchRate: frame.channel_state.includes("COMPROMISED") ? 24.8 : 49.9,
        };
        setCurrentQber(frame.live_qber);
        if (frame.eve_active) setPurgedKeyCounter(frame.purged_key_blocks);
        setData((prev) => [...prev.slice(1), newPoint]);
      },
      onClose: () => setBackendConnected(false),
      onError: () => setBackendConnected(false),
    });
    wsRef.current = ws;
    return () => {
      disconnectQkdWebSocket(ws);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Eve on backend WS; if disconnected, local simulation handles it
  const handleEveToggle = () => {
    const next = !eveActive;
    setEveActive(next);
    sendWsEveToggle(wsRef.current, next);
  };

  // Client-side simulation fallback (only active when backend WS is disconnected)
  useEffect(() => {
    if (backendConnected || isPaused) return;

    const interval = setInterval(() => {
      setData((prevData) => {
        if (prevData.length === 0) return prevData;

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          hour12: false,
          minute: "2-digit",
          second: "2-digit",
        });

        let newQber: number;
        let status: "SECURE" | "COMPROMISED" = "SECURE";

        if (eveActive) {
          newQber = Number((24.0 + Math.random() * 4.2).toFixed(2));
          status = "COMPROMISED";
        } else {
          newQber = Number((1.6 + Math.random() * 1.1).toFixed(2));
          status = "SECURE";
        }

        setCurrentQber(newQber);

        if (eveActive) {
          setPurgedKeyCounter((prev) => prev + 1);
        }

        const newPoint: QkdDataPoint = {
          time: timeStr,
          qber: newQber,
          threshold: 11.0,
          rawKeyRate: eveActive ? 0 : Math.round(1220 + Math.random() * 50),
          siftedKeyRate: eveActive ? 0 : Math.round(580 + Math.random() * 30),
          status,
          detectedPhotons: Math.round(48000 + Math.random() * 1200),
          basisMatchRate: eveActive ? 24.8 : 49.9,
        };

        return [...prevData.slice(1), newPoint];
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [eveActive, isPaused, backendConnected]);

  const isExceeded = currentQber > 11.0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-2xs">
      {/* Header and Eve Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Qiskit BB84 QKD Simulator
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold">
              Quantum Key Distribution Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of Quantum Bit Error Rate (QBER) across Alice ↔
            Bob single-photon channel.
          </p>
        </div>

        {/* Eavesdropper Toggle Switch */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 px-3 rounded-md border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Simulate Eavesdropper (Eve)
            </span>
            <button
              role="switch"
              aria-checked={eveActive}
              onClick={handleEveToggle}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                eveActive ? "bg-red-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  eveActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition"
            title={isPaused ? "Resume Live Stream" : "Pause Stream"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div
          className={`p-2 rounded border ${
            isExceeded
              ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase">Live QBER</div>
          <div
            className={`text-lg font-bold ${
              isExceeded
                ? "text-red-600 dark:text-red-400"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {currentQber.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500">
            Threshold: 11.00% max
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase">Channel State</div>
          <div
            className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
              isExceeded ? "text-red-600" : "text-emerald-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isExceeded ? "bg-red-600 animate-ping" : "bg-emerald-500"
              }`}
            ></span>
            {isExceeded ? "INTERCEPTED" : "COHERENT"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {eveActive ? "Eve Active (No-Cloning Violated)" : "Dark Fiber #04"}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase">Secret Key Rate</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {eveActive ? "0 bps" : "592 kbps"}
          </div>
          <div className="text-[10px] text-slate-500">
            {eveActive ? "Key Gen Aborted" : "Toeplitz Hash Extracted"}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase">Purged Key Blocks</div>
          <div
            className={`text-lg font-bold ${
              purgedKeyCounter > 0
                ? "text-red-600 dark:text-red-400"
                : "text-slate-500"
            }`}
          >
            {purgedKeyCounter}
          </div>
          <div className="text-[10px] text-slate-500">
            Sifted keys wiped on anomaly
          </div>
        </div>
      </div>

      {/* QBER Line Chart */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 mb-1">
          <span>Quantum Channel Bit Error Rate Over Time (%)</span>
          <span className="text-red-600 dark:text-red-400 font-semibold">
            Red Dashed Line = 11.0% BB84 Protocol Abort Limit
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#94a3b8"
                opacity={0.15}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 32]}
                tickCount={7}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as QkdDataPoint;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded shadow-lg text-xs font-mono">
                        <div className="text-slate-400 text-[10px] mb-1">
                          {d.time}
                        </div>
                        <div
                          className={`font-bold ${
                            d.qber > 11.0 ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          QBER: {d.qber}% {d.qber > 11.0 ? "(CRITICAL)" : "(SAFE)"}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          Threshold: 11.0% | Sifted Rate: {d.siftedKeyRate} kbps
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Fixed 11% Theoretical Safety Line */}
              <ReferenceLine
                y={11.0}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "11% BB84 Cutoff",
                  position: "insideTopRight",
                  fill: "#dc2626",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />

              {/* Dynamic QBER Line: Turns Red when Eve is active / threshold exceeded */}
              <Line
                type="monotone"
                dataKey="qber"
                stroke={isExceeded ? "#dc2626" : "#2563eb"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinical System Alert Log - Required by prompt */}
      <div className="mt-3">
        {isExceeded ? (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-900 rounded p-3 text-xs font-mono flex items-start space-x-2.5 transition-all">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-700 dark:text-red-400 uppercase tracking-tight">
                [SYSTEM ALERT: SECURITY VIOLATION]
              </div>
              <div className="text-red-800 dark:text-red-300 mt-0.5 font-semibold">
                Quantum measurement anomaly detected. Key exchange aborted.
                Rotating keys.
              </div>
              <div className="text-red-700/80 dark:text-red-400/80 text-[11px] mt-1">
                Eavesdropper projective collapse identified at QBER={currentQber.toFixed(2)}% (Safety Threshold: 11.00%). All 2,048,512 bits in sifted FIFO buffer have been purged to prevent partial key leakage. Phase-encoded Alice/Bob basis generator rotated to seed 0x7E3A9F.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-xs font-mono flex items-center justify-between text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                [STATUS: NOMINAL] Quantum channel coherent. Single-photon detector noise within acceptable parameters (&lt; 3.0%).
              </span>
            </div>
            {onOpenDeepView && (
              <button
                onClick={onOpenDeepView}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-[11px]"
              >
                Open Deep Lab Console &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
