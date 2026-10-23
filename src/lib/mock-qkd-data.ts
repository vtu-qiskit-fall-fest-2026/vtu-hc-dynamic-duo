export interface QkdDataPoint {
  time: string;
  qber: number; // Quantum Bit Error Rate in percent
  threshold: number; // 11.0% fixed
  rawKeyRate: number; // kbps
  siftedKeyRate: number; // kbps
  status: "SECURE" | "COMPROMISED";
  detectedPhotons: number;
  basisMatchRate: number; // %
}

export function generateInitialQkdData(): QkdDataPoint[] {
  const points: QkdDataPoint[] = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 2000);
    const timeStr = timestamp.toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });
    // Normal baseline QBER between 1.4% and 2.6%
    const noise = 1.6 + Math.sin(i * 0.4) * 0.5 + Math.random() * 0.4;
    points.push({
      time: timeStr,
      qber: Number(noise.toFixed(2)),
      threshold: 11.0,
      rawKeyRate: Math.round(1240 + Math.random() * 40),
      siftedKeyRate: Math.round(590 + Math.random() * 25),
      status: "SECURE",
      detectedPhotons: Math.round(48200 + Math.random() * 800),
      basisMatchRate: Number((49.8 + Math.random() * 0.8).toFixed(1)),
    });
  }
  return points;
}

export interface QkdTelemetry {
  protocol: string;
  channelType: string;
  fiberDistanceKm: number;
  attenuationDb: number;
  currentQber: number;
  thresholdQber: number;
  siftedKeyBits: number;
  purgedKeysCount: number;
  eveActive: boolean;
  bellStateFidelity: number;
  privacyAmplificationCompression: string;
}

export const INITIAL_TELEMETRY: QkdTelemetry = {
  protocol: "BB84 Decoy-State Phase-Coded QKD",
  channelType: "Dedicated Dark Fiber (SMF-28)",
  fiberDistanceKm: 42.6,
  attenuationDb: 8.52,
  currentQber: 2.14,
  thresholdQber: 11.0,
  siftedKeyBits: 2048512,
  purgedKeysCount: 0,
  eveActive: false,
  bellStateFidelity: 0.984,
  privacyAmplificationCompression: "2.4:1 (Toeplitz Hash)",
};
