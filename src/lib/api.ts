/**
 * Q-Shield API Client
 * Typed fetch utilities for the FastAPI backend at http://localhost:8000
 * Every function falls back to static mock data if the backend is unreachable.
 */

import type { CbomItem as FrontendCbomItem } from "@/lib/mock-cbom-data";

const BASE_URL = "http://localhost:8000/api/v1";
const WS_BASE  = "ws://localhost:8000";

// ─── Types (mirrors backend Pydantic schemas) ────────────────────────────────

export interface MoscaParams {
  data_shelf_life_years?: number;
  migration_horizon_years?: number;
  crqc_timeline_years?: number;
}

export interface MoscaResponse {
  data_shelf_life_years: number;
  migration_horizon_years: number;
  crqc_timeline_years: number;
  total_needed_window_years: number;
  deficit_window_years: number;
  is_compromised: boolean;
  status: string;
  hndl_threat_active: boolean;
  rationale: string;
}

export interface DashboardSummary {
  mosca: MoscaResponse;
  total_assets: number;
  monitored_repos_pods: number;
  shor_vulnerable_critical: number;
  grover_vulnerable_medium: number;
  pqc_migration_progress: number;
  pqc_migrated_count: number;
  compliance_mode: string;
}

export interface CbomItem {
  id: string;
  asset_name: string;
  service: string;
  repo: string;
  file_path: string;
  line_number: number;
  current_algorithm: string;
  algorithm_type: string;
  key_length: string;
  risk_category: string;
  recommended_pqc: string;
  pqc_standard: string;
  impact_severity: number;
  ease_of_exploitation: number;
  location_type: string;
  status: string;
  code_snippet: string;
  remediation_snippet: string;
  data_shelf_life_years: number;
}

export interface CbomScanRequest {
  target_type: "code_snippet" | "tls_endpoint" | "local_file";
  target: string;
  code_snippet?: string;
  service_name?: string;
}

export interface CbomScanResponse {
  target: string;
  target_type: string;
  scanned_primitives: number;
  new_findings: CbomItem[];
  message: string;
}

export interface RemediatePrRequest {
  asset_id?: string;
  file_path?: string;
  repo?: string;
  target_pqc?: string;
}

export interface RemediatePrResponse {
  pr_number: number;
  title: string;
  repo: string;
  branch: string;
  author: string;
  vulnerable_cipher: string;
  migrated_cipher: string;
  unified_diff: string;
  ci_status: string;
  nist_compliance: string;
  created_at: string;
  status: string;
}

export interface RemediateProxyRequest {
  cluster_name?: string;
  pod_name?: string;
  target_service?: string;
  hybrid_kex?: string;
}

export interface RemediateProxyResponse {
  status: string;
  sidecar_image: string;
  tunnel_ciphers: string;
  derived_shared_secret_prefix: string;
  sidecar_yaml: string;
  terminal_logs: string[];
  updated_progress_percent: number;
}

export interface QkdSimulateRequest {
  eve_active: boolean;
  n_qubits?: number;
  fiber_distance_km?: number;
}

export interface PhotonEntry {
  index: number;
  alice_bit: number;
  alice_basis: string;
  eve_intercepted: boolean;
  eve_basis?: string;
  bob_basis: string;
  bob_measured: number;
  bases_matched: boolean;
  is_error: boolean;
  kept_in_sifted_key: boolean;
}

export interface QkdSimulateResponse {
  time_iso: string;
  live_qber: number;
  threshold_qber: number;
  channel_state: string;
  raw_key_rate_kbps: number;
  sifted_key_rate_kbps: number;
  secret_key_rate_bps: number;
  purged_key_blocks: number;
  bell_state_fidelity: number;
  eve_active: boolean;
  sifted_key_hex: string;
  alert_message?: string;
  photon_sample: PhotonEntry[];
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  timeoutMs = 5000
): Promise<T | null> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // backend offline or CORS issue – caller uses fallback
  } finally {
    clearTimeout(tid);
  }
}

// ─── Dashboard / Mosca ───────────────────────────────────────────────────────

export async function fetchDashboardSummary(
  params?: MoscaParams
): Promise<DashboardSummary | null> {
  const qs = params
    ? `?shelf_life=${params.data_shelf_life_years ?? 15}&migration=${params.migration_horizon_years ?? 3}&crqc=${params.crqc_timeline_years ?? 7}`
    : "";
  return apiRequest<DashboardSummary>(`/dashboard/summary${qs}`);
}

export async function postMoscaCalculate(
  params: MoscaParams
): Promise<MoscaResponse | null> {
  return apiRequest<MoscaResponse>("/mosca/calculate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── CBOM Inventory & Scanner ─────────────────────────────────────────────────

export async function fetchCbomInventory(filter?: string): Promise<CbomItem[] | null> {
  const qs = filter ? `?filter_category=${encodeURIComponent(filter)}` : "";
  return apiRequest<CbomItem[]>(`/cbom/inventory${qs}`);
}

export async function postCbomScan(req: CbomScanRequest): Promise<CbomScanResponse | null> {
  return apiRequest<CbomScanResponse>("/cbom/scan", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export type BackendCbomItem = CbomItem;

export function adaptCbomToFrontend(raw: CbomItem): FrontendCbomItem {
  return {
    id: raw.id,
    assetName: raw.asset_name,
    service: raw.service,
    repo: raw.repo,
    filePath: raw.file_path,
    lineNumber: raw.line_number,
    currentAlgorithm: raw.current_algorithm,
    algorithmType: (raw.algorithm_type as any) || "Asymmetric",
    keyLength: raw.key_length,
    riskCategory: (raw.risk_category as any) || "Shor's Vulnerable",
    recommendedPqc: raw.recommended_pqc,
    pqcStandard: raw.pqc_standard,
    impactScore: raw.impact_severity,
    exploitEase: raw.ease_of_exploitation,
    locationType: (raw.location_type as any) || "TLS Termination",
    status: (raw.status as any) || "Exposed",
    codeSnippet: raw.code_snippet,
    remediationSnippet: raw.remediation_snippet,
    dataShelfLifeYears: raw.data_shelf_life_years,
  };
}

export async function fetchAdaptedCbomInventory(filter?: string): Promise<FrontendCbomItem[] | null> {
  const raw = await fetchCbomInventory(filter);
  if (!raw) return null;
  return raw.map(adaptCbomToFrontend);
}

export async function fetchCbomExport(): Promise<object | null> {
  return apiRequest<object>("/cbom/export");
}

// ─── PQC Remediation ─────────────────────────────────────────────────────────

export async function postRemediatePr(
  req: RemediatePrRequest
): Promise<RemediatePrResponse | null> {
  return apiRequest<RemediatePrResponse>("/remediate/pr", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function postRemediateProxy(
  req: RemediateProxyRequest
): Promise<RemediateProxyResponse | null> {
  return apiRequest<RemediateProxyResponse>("/remediate/proxy", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ─── BB84 QKD Simulation ─────────────────────────────────────────────────────

export async function postQkdSimulate(
  req: QkdSimulateRequest
): Promise<QkdSimulateResponse | null> {
  return apiRequest<QkdSimulateResponse>("/qkd/simulate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ─── QKD WebSocket (live telemetry) ──────────────────────────────────────────

export interface QkdWebSocketOptions {
  onMessage: (frame: QkdSimulateResponse) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}

export function connectQkdWebSocket(opts: QkdWebSocketOptions): WebSocket | null {
  if (typeof window === "undefined") return null;
  try {
    const ws = new WebSocket(`${WS_BASE}/ws/qkd/telemetry`);

    ws.onopen = () => {
      opts.onOpen?.();
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as QkdSimulateResponse;
        opts.onMessage(data);
      } catch {
        // skip malformed frames
      }
    };

    ws.onclose = () => opts.onClose?.();
    ws.onerror = () => opts.onError?.();

    return ws;
  } catch {
    return null;
  }
}

/**
 * Safely disconnects a WebSocket without triggering browser warnings
 * caused by closing a socket while it is still in the CONNECTING state (e.g. during React StrictMode).
 */
export function disconnectQkdWebSocket(ws: WebSocket | null) {
  if (!ws) return;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;

  if (ws.readyState === WebSocket.OPEN) {
    ws.close(1000, "Clean disconnect");
  } else if (ws.readyState === WebSocket.CONNECTING) {
    ws.onopen = () => {
      try {
        ws.close(1000, "Clean disconnect after open");
      } catch {
        // ignore
      }
    };
  }
}

export function sendWsEveToggle(ws: WebSocket | null, eveActive: boolean) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ eve_active: eveActive }));
  }
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8000/api/v1/health", { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Cryptographic Policy & Governance ────────────────────────────────────────

export interface PolicyConfig {
  fips203_enabled: boolean;
  fips204_enabled: boolean;
  block_shor_merges: boolean;
  cnsa2_timeline: string;
  enforcement_mode: string;
  updated_at?: string;
}

export async function fetchPolicyConfig(): Promise<PolicyConfig | null> {
  return apiRequest<PolicyConfig>("/policy");
}

export async function updatePolicyConfig(config: PolicyConfig): Promise<PolicyConfig | null> {
  return apiRequest<PolicyConfig>("/policy", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

