"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Radio,
  RotateCw,
  Cpu,
  Layers,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
import { generateInitialQkdData, QkdDataPoint } from "@/lib/mock-qkd-data";
import {
  postQkdSimulate,
  connectQkdWebSocket,
  disconnectQkdWebSocket,
  sendWsEveToggle,
  QkdSimulateResponse,
} from "@/lib/api";

interface PhotonState {
  index: number;
  aliceBit: 0 | 1;
  aliceBasis: "+" | "×";
  eveIntercepted: boolean;
  eveBasis?: "+" | "×";
  bobBasis: "+" | "×";
  bobBit: 0 | 1;
  basesMatched: boolean;
  isError: boolean;
  keptInSiftedKey: boolean;
}

export function QkdDeepSimulatorView() {
  const [data, setData] = useState<QkdDataPoint[]>([]);
  const [eveActive, setEveActive] = useState<boolean>(false);
  const [fiberDistance, setFiberDistance] = useState<number>(42);
  const [photonStream, setPhotonStream] = useState<PhotonState[]>([]);
  const [currentQber, setCurrentQber] = useState<number>(1.85);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [siftedKeyHex, setSiftedKeyHex] = useState<string>("4a7f9c2e01b8d3f4e5a6c7b890123456");
  const wsRef = useRef<WebSocket | null>(null);

  // Generate simulated photons based on Eve's presence (client fallback)
  const generatePhotons = (eve: boolean): PhotonState[] => {
    const list: PhotonState[] = [];
    for (let i = 1; i <= 10; i++) {
      const aliceBit: 0 | 1 = Math.random() > 0.5 ? 1 : 0;
      const aliceBasis: "+" | "×" = Math.random() > 0.5 ? "+" : "×";
      const bobBasis: "+" | "×" = Math.random() > 0.5 ? "+" : "×";

      let bobBit: 0 | 1 = aliceBit;
      let eveBasis: "+" | "×" | undefined = undefined;

      if (eve) {
        eveBasis = Math.random() > 0.5 ? "+" : "×";
        // If Eve chose wrong basis, projective measurement changes photon state
        if (eveBasis !== aliceBasis) {
          bobBit = Math.random() > 0.5 ? 1 : 0;
        }
      } else {
        // Normal baseline error rate ~2%
        if (Math.random() < 0.02) {
          bobBit = (1 - aliceBit) as 0 | 1;
        }
      }

      const basesMatched = aliceBasis === bobBasis;
      const isError = basesMatched && aliceBit !== bobBit;
      const keptInSiftedKey = basesMatched && !isError && !eve;

      list.push({
        index: i,
        aliceBit,
        aliceBasis,
        eveIntercepted: eve,
        eveBasis,
        bobBasis,
        bobBit,
        basesMatched,
        isError,
        keptInSiftedKey,
      });
    }
    return list;
  };

  // Run backend Qiskit BB84 simulation
  const runQuantumSimulation = async (eve: boolean, dist: number) => {
    const res = await postQkdSimulate({
      eve_active: eve,
      n_qubits: 64,
      fiber_distance_km: dist,
    });

    if (res && res.photon_sample && res.photon_sample.length > 0) {
      const mapped: PhotonState[] = res.photon_sample.slice(0, 10).map((p) => ({
        index: p.index,
        aliceBit: (p.alice_bit === 1 ? 1 : 0) as 0 | 1,
        aliceBasis: (p.alice_basis === "+" ? "+" : "×") as "+" | "×",
        eveIntercepted: p.eve_intercepted,
        eveBasis: p.eve_basis ? ((p.eve_basis === "+" ? "+" : "×") as "+" | "×") : undefined,
        bobBasis: (p.bob_basis === "+" ? "+" : "×") as "+" | "×",
        bobBit: (p.bob_measured === 1 ? 1 : 0) as 0 | 1,
        basesMatched: p.bases_matched,
        isError: p.is_error,
        keptInSiftedKey: p.kept_in_sifted_key,
      }));
      setPhotonStream(mapped);
      setCurrentQber(res.live_qber);
      if (res.sifted_key_hex) setSiftedKeyHex(res.sifted_key_hex);
    } else {
      setPhotonStream(generatePhotons(eve));
    }
  };

  // Initial load
  useEffect(() => {
    setData(generateInitialQkdData());
    runQuantumSimulation(eveActive, fiberDistance);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to backend WebSocket for live telemetry streaming
  useEffect(() => {
    const ws = connectQkdWebSocket({
      onOpen: () => setBackendConnected(true),
      onMessage: (frame: QkdSimulateResponse) => {
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
        if (frame.sifted_key_hex) setSiftedKeyHex(frame.sifted_key_hex);
        setData((prev) => [...prev.slice(1), newPoint]);

        if (frame.photon_sample && frame.photon_sample.length > 0) {
          const mapped: PhotonState[] = frame.photon_sample.slice(0, 10).map((p) => ({
            index: p.index,
            aliceBit: (p.alice_bit === 1 ? 1 : 0) as 0 | 1,
            aliceBasis: (p.alice_basis === "+" ? "+" : "×") as "+" | "×",
            eveIntercepted: p.eve_intercepted,
            eveBasis: p.eve_basis ? ((p.eve_basis === "+" ? "+" : "×") as "+" | "×") : undefined,
            bobBasis: (p.bob_basis === "+" ? "+" : "×") as "+" | "×",
            bobBit: (p.bob_measured === 1 ? 1 : 0) as 0 | 1,
            basesMatched: p.bases_matched,
            isError: p.is_error,
            keptInSiftedKey: p.kept_in_sifted_key,
          }));
          setPhotonStream(mapped);
        }
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

  // Handle Eve Toggle
  const handleEveToggle = () => {
    const nextEve = !eveActive;
    setEveActive(nextEve);
    sendWsEveToggle(wsRef.current, nextEve);
    runQuantumSimulation(nextEve, fiberDistance);
  };

  // Client-side fallback animation when backend WS is offline
  useEffect(() => {
    if (backendConnected) return;

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
        if (eveActive) {
          newQber = Number((24.2 + Math.random() * 3.8).toFixed(2));
        } else {
          newQber = Number((1.5 + Math.random() * 1.2).toFixed(2));
        }
        setCurrentQber(newQber);

        const newPoint: QkdDataPoint = {
          time: timeStr,
          qber: newQber,
          threshold: 11.0,
          rawKeyRate: eveActive ? 0 : 1240,
          siftedKeyRate: eveActive ? 0 : 580,
          status: eveActive ? "COMPROMISED" : "SECURE",
          detectedPhotons: 48000,
          basisMatchRate: eveActive ? 24.5 : 50.1,
        };

        return [...prevData.slice(1), newPoint];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [eveActive, backendConnected]);

  const isExceeded = currentQber > 11.0;

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Qiskit BB84 Quantum Key Distribution Laboratory
            </h2>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 font-semibold">
              Single-Photon Decoy State Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical quantum link simulation between Alice (Transmitter) and Bob
            (Receiver) with real-time eavesdropping detection via Quantum No-Cloning.
          </p>
        </div>

        {/* Controls: Fiber Distance Slider + Eve Toggle */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Fiber Distance Slider */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1.5 px-3 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Fiber Distance:
            </span>
            <input
              type="range"
              min={5}
              max={150}
              step={5}
              value={fiberDistance}
              onChange={(e) => {
                const d = Number(e.target.value);
                setFiberDistance(d);
                runQuantumSimulation(eveActive, d);
              }}
              className="w-20 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 min-w-[45px]">
              {fiberDistance} km
            </span>
          </div>

          {/* Eve Toggle */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1.5 px-3 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Eve Attack
            </span>
            <button
              role="switch"
              aria-checked={eveActive}
              onClick={handleEveToggle}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
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
        </div>
      </div>

      {/* Real-time Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div
          className={`p-3 rounded-lg border ${
            isExceeded
              ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          }`}
        >
          <span className="text-slate-500 text-[10px] block">LIVE QBER</span>
          <span
            className={`text-xl font-bold ${
              isExceeded
                ? "text-red-600 dark:text-red-400"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {currentQber.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            {isExceeded ? "ABORT: Exceeds 11.0%" : "Nominal (&lt; 11.0%)"}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-slate-500 text-[10px] block">
            CHANNEL STATUS
          </span>
          <span
            className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${
              isExceeded ? "text-red-600" : "text-emerald-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isExceeded ? "bg-red-600 animate-ping" : "bg-emerald-500"
              }`}
            ></span>
            {isExceeded ? "COMPROMISED" : "COHERENT"}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Dark Fiber: {fiberDistance} km
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-slate-500 text-[10px] block">
            SIFTED KEY EXTRACTION
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {eveActive ? "0 bps" : "592 kbps"}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {eveActive ? "Purged on detection" : "Toeplitz Hash privacy amp"}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-slate-500 text-[10px] block">
            BELL STATE FIDELITY
          </span>
          <span
            className={`text-xl font-bold ${
              eveActive ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {eveActive ? "0.612" : "0.984"}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {eveActive ? "State decoherence" : "High entanglement"}
          </span>
        </div>
      </div>

      {/* Clinical QBER Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Real-Time Quantum Channel Bit Error Rate (QBER)
          </span>
          <span className="text-red-600 dark:text-red-400 font-semibold text-[11px]">
            Threshold Limit: 11.00%
          </span>
        </div>

        <div className="h-64 w-full">
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
              <Tooltip />
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

        {/* Clinical Alert Box */}
        <div className="mt-3">
          {isExceeded ? (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-900 rounded p-3 text-xs font-mono flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-700 dark:text-red-400 uppercase">
                  [SYSTEM ALERT: ANOMALY TRIGGERED]
                </div>
                <div className="text-red-800 dark:text-red-300 font-semibold mt-0.5">
                  Quantum measurement anomaly detected. Key exchange aborted.
                  Rotating keys.
                </div>
                <div className="text-red-700/80 dark:text-red-400/80 text-[11px] mt-1">
                  Eavesdropping violates quantum no-cloning theorem. Current error
                  rate: {currentQber.toFixed(2)}% (&gt; 11.0% BB84 bound). Key
                  sifting terminated. Alice & Bob channel basis generators
                  re-synchronized.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-xs font-mono flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                [NOMINAL TRANSMISSION] QBER is within quantum shot-noise limit. Key
                exchange proceeding with privacy amplification.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Basis Reconciliation & Photon State Inspection Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Photon Polarization & Basis Sifting Table (10-Photon Pulse Sample)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizing quantum measurement collapse: when Eve intercepts with
              an incompatible basis, Bob observes an irrecoverable state shift.
            </p>
          </div>
          <button
            onClick={() => runQuantumSimulation(eveActive, fiberDistance)}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition font-mono"
          >
            <RotateCw className="w-3 h-3" /> Pulse Next Photons
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase">
                <th className="py-2 px-3">Photon #</th>
                <th className="py-2 px-3">Alice Bit</th>
                <th className="py-2 px-3">Alice Basis</th>
                <th className="py-2 px-3">Eve Basis</th>
                <th className="py-2 px-3">Bob Basis</th>
                <th className="py-2 px-3">Bob Measured</th>
                <th className="py-2 px-3">Bases Matched?</th>
                <th className="py-2 px-3">Quantum State Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
              {photonStream.map((p) => (
                <tr
                  key={p.index}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    p.isError ? "bg-red-50/50 dark:bg-red-950/30" : ""
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400">#{p.index}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                    {p.aliceBit}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                      {p.aliceBasis}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {p.eveIntercepted ? (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold">
                        {p.eveBasis} (Intercept)
                      </span>
                    ) : (
                      <span className="text-slate-400">None (Passive)</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                      {p.bobBasis}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                    {p.bobBit}
                  </td>
                  <td className="py-2 px-3">
                    {p.basesMatched ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> MATCH
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Discard
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {p.isError ? (
                      <span className="text-red-600 font-bold">
                        COLLAPSED ERROR (Eve detected)
                      </span>
                    ) : p.keptInSiftedKey ? (
                      <span className="text-emerald-600 font-bold">
                        SIFTED KEY BIT
                      </span>
                    ) : (
                      <span className="text-slate-400">Discarded in Sifting</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
