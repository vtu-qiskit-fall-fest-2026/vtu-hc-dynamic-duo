"""
Q-Shield: Enterprise Post-Quantum Cryptography & Quantum DevSecOps Platform
===========================================================================
FastAPI Backend  →  http://localhost:8000
Next.js Frontend →  http://localhost:3000

LLM Engine : Groq SDK (llama3-70b-8192) for real-time PQC code patching
Quantum Sim: Qiskit AerSimulator — BB84 single-photon circuits
Scanners   : Python ast / ssl / socket — static AST + live TLS probing
"""

import asyncio
import json
import logging
import os
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# --- Load .env if present (GROQ_API_KEY, etc.) ---
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from backend.models.schemas import (
    MoscaRequest,
    MoscaResponse,
    DashboardSummary,
    CbomItemSchema,
    CbomScanRequest,
    CbomScanResponse,
    RemediatePrRequest,
    RemediatePrResponse,
    RemediateProxyRequest,
    RemediateProxyResponse,
    QkdSimulateRequest,
    QkdSimulateResponse,
    PolicyConfig,
)
from backend.services.mosca_engine import calculate_mosca_theorem, get_dashboard_summary
from backend.services.cbom_scanner import get_cbom_inventory, scan_target, export_cyclonedx_1_6
from backend.services.groq_remediator import (
    generate_pqc_pr_patch,
    deploy_pqc_proxy,
    get_migration_stats,
)
from backend.services.qkd_bb84 import simulate_bb84_protocol

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("q-shield-backend")

# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Q-Shield Quantum Security & DevSecOps API",
    description=(
        "Production-grade Post-Quantum Cryptography engine (NIST FIPS 203/204/205), "
        "powered by Groq llama3-70b-8192 for instant PQC code remediation. "
        "Includes Qiskit BB84 QKD simulation, live CBOM inventory scanner, "
        "and Hybrid X25519+ML-KEM-768 sidecar orchestrator."
    ),
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — Allow Next.js dev server at localhost:3000
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# ─── SYSTEM ─────────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """
    Liveness probe — returns backend status, Groq availability, and current
    PQC migration progress percentage.
    """
    groq_key_set = bool(os.environ.get("GROQ_API_KEY", ""))
    stats = get_migration_stats()
    return {
        "status":                       "HEALTHY",
        "service":                      "q-shield-backend",
        "version":                      "2.0.0",
        "groq_model":                   os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b"),
        "groq_api_key_configured":      groq_key_set,
        "fips_standard":                "NIST FIPS 203 (ML-KEM) & 204 (ML-DSA) & 205 (SLH-DSA)",
        "pqc_migration_progress_pct":   stats["progress_percent"],
        "pqc_migration_progress_percent": stats["progress_percent"],
        "pqc_migrated_count":           stats["migrated_count"],
    }


# ---------------------------------------------------------------------------
# ─── 1. DASHBOARD & MOSCA'S THEOREM ─────────────────────────────────────────
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/dashboard/summary",
    response_model=DashboardSummary,
    tags=["Dashboard"],
    summary="Enterprise PQC Dashboard Summary",
)
async def dashboard_summary(
    shelf_life: float = Query(15.0, description="X: Data confidentiality shelf-life in years"),
    migration:  float = Query(3.0,  description="Y: Enterprise PQC migration horizon in years"),
    crqc:       float = Query(7.0,  description="Z: Years until Cryptanalytically Relevant Quantum Computer"),
):
    """
    Returns enterprise KPIs: Mosca theorem deficit, total cryptographic assets,
    Shor/Grover vulnerability counts, PQC migration %, and compliance mode.
    """
    req = MoscaRequest(
        data_shelf_life_years=shelf_life,
        migration_horizon_years=migration,
        crqc_timeline_years=crqc,
    )
    return get_dashboard_summary(req)


@app.post(
    "/api/v1/mosca/calculate",
    response_model=MoscaResponse,
    tags=["Dashboard"],
    summary="Mosca's Theorem Calculator",
)
async def calculate_mosca(req: MoscaRequest):
    """
    Evaluates Mosca's Inequality: X + Y > Z.
    Returns deficit exposure window, HNDL threat status, and remediation rationale.
    """
    return calculate_mosca_theorem(req)


# ---------------------------------------------------------------------------
# ─── 2. CRYPTOGRAPHIC BILL OF MATERIALS (CBOM) ──────────────────────────────
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/cbom/inventory",
    response_model=list[CbomItemSchema],
    tags=["CBOM"],
    summary="Live CBOM Cryptographic Asset Inventory",
)
async def get_cbom(
    filter_category: Optional[str] = Query(
        None,
        description="Filter by risk: 'shor', 'grover', 'deprecated', 'pqc', or omit for All",
    ),
):
    """
    Returns the full inventory of cryptographic primitives discovered across
    source repos, TLS endpoints, and Kubernetes configs — CycloneDX 1.6 compliant.
    """
    items = get_cbom_inventory()
    if filter_category and filter_category.lower() != "all":
        fc = filter_category.lower()
        if "shor" in fc:
            items = [i for i in items if "Shor"       in i.risk_category]
        elif "grover" in fc:
            items = [i for i in items if "Grover"     in i.risk_category]
        elif "deprecated" in fc:
            items = [i for i in items if "Deprecated" in i.risk_category]
        elif "pqc" in fc:
            items = [i for i in items if "PQC"        in i.risk_category]
    return items


@app.post(
    "/api/v1/cbom/scan",
    response_model=CbomScanResponse,
    tags=["CBOM"],
    summary="Dynamic Cryptographic Scanner (AST + TLS)",
)
async def scan_cbom(req: CbomScanRequest):
    """
    Triggers dynamic scanning on:
    - Code snippets (Regex / AST pattern matching)
    - Local file paths
    - Live HTTPS/TLS endpoints (SSL socket handshake probing)
    Returns new CBOM findings appended to the live inventory.
    """
    try:
        return scan_target(req)
    except Exception as exc:
        logger.error(f"CBOM scan error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get(
    "/api/v1/cbom/export",
    tags=["CBOM"],
    summary="Export CBOM — CycloneDX 1.6 JSON",
)
async def export_cbom():
    """
    Exports the enterprise CBOM in CycloneDX 1.6 JSON format, including
    cryptographic properties, NIST FIPS 203 migration paths, and risk scores.
    """
    return JSONResponse(
        content=export_cyclonedx_1_6(),
        media_type="application/vnd.cyclonedx+json",
    )


# ---------------------------------------------------------------------------
# ─── 3. GROQ-POWERED PQC REMEDIATION ENGINE ─────────────────────────────────
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/remediate/pr",
    response_model=RemediatePrResponse,
    tags=["Remediation"],
    summary="AI PQC Code Patch — Groq llama3-70b-8192",
)
async def create_pqc_pr(req: RemediatePrRequest):
    """
    Calls Groq llama3-70b-8192 to synthesize an intelligent unified git diff
    that replaces legacy RSA/ECDSA/AES-128 code with NIST FIPS 203/204/205.

    Falls back to production-quality static templates if the Groq API is
    unavailable or the GROQ_API_KEY environment variable is not set.
    """
    try:
        return generate_pqc_pr_patch(req)
    except Exception as exc:
        logger.error(f"Remediate PR error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post(
    "/api/v1/remediate/proxy",
    response_model=RemediateProxyResponse,
    tags=["Remediation"],
    summary="Hybrid PQC Proxy Sidecar Deployment",
)
async def deploy_sidecar_proxy(req: RemediateProxyRequest):
    """
    Performs a real classical X25519 + ML-KEM-768 hybrid key handshake,
    derives a 256-bit shared secret via HKDF-SHA384, generates production-ready
    Envoy v3 sidecar YAML, and increments the enterprise PQC migration counter.
    """
    try:
        return deploy_pqc_proxy(req)
    except Exception as exc:
        logger.error(f"Proxy deploy error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# ─── 4. QISKIT BB84 QKD SIMULATION ─────────────────────────────────────────
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/qkd/simulate",
    response_model=QkdSimulateResponse,
    tags=["QKD Telemetry"],
    summary="BB84 Quantum Key Distribution Simulation",
)
async def simulate_qkd(req: QkdSimulateRequest):
    """
    Executes a full BB84 single-photon protocol circuit on the Qiskit AerSimulator.
    If Eve is active, projective mid-circuit measurements collapse qubit state,
    driving the QBER above the 11% abort threshold (~25% theoretical).
    """
    return simulate_bb84_protocol(
        eve_active=req.eve_active,
        n_qubits=req.n_qubits,
        fiber_distance_km=req.fiber_distance_km,
    )


# ---------------------------------------------------------------------------
# ─── 5. REAL-TIME QKD WebSocket TELEMETRY ───────────────────────────────────
# ---------------------------------------------------------------------------
@app.websocket("/ws/qkd/telemetry")
async def websocket_qkd_telemetry(websocket: WebSocket):
    """
    Bidirectional WebSocket streaming live BB84 telemetry frames at 1.2 s intervals.

    Clients can toggle Eve eavesdropper injection by sending JSON:
        {"eve_active": true}   — activates eavesdropper (QBER spikes to ~25%)
        {"eve_active": false}  — deactivates eavesdropper (QBER returns to ~2%)
    """
    await websocket.accept()
    logger.info("WebSocket client connected to QKD telemetry stream")
    eve_active = False

    async def _receive_loop():
        nonlocal eve_active
        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    payload = json.loads(raw)
                    if "eve_active" in payload:
                        eve_active = bool(payload["eve_active"])
                        logger.info(f"WS — eve_active toggled → {eve_active}")
                except Exception:
                    pass
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass

    recv_task = asyncio.create_task(_receive_loop())

    try:
        while True:
            frame = simulate_bb84_protocol(eve_active=eve_active, n_qubits=64)
            await websocket.send_text(frame.model_dump_json())
            await asyncio.sleep(1.2)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from QKD stream")
    except Exception as exc:
        logger.warning(f"WebSocket stream closed: {exc}")
    finally:
        recv_task.cancel()


# ---------------------------------------------------------------------------
# ─── 6. POLICY & COMPLIANCE GOVERNANCE ──────────────────────────────────────
# ---------------------------------------------------------------------------
_CURRENT_POLICY = PolicyConfig(
    fips203_enabled=True,
    fips204_enabled=True,
    block_shor_merges=True,
    cnsa2_timeline="2030-strict",
    enforcement_mode="Strict",
    updated_at="Initial System Boot",
)

@app.get(
    "/api/v1/policy",
    response_model=PolicyConfig,
    tags=["Policy"],
    summary="Get Cryptographic Governance Policies",
)
async def get_policy():
    """Returns active enterprise cryptographic enforcement policies and DevSecOps gates."""
    return _CURRENT_POLICY

@app.post(
    "/api/v1/policy",
    response_model=PolicyConfig,
    tags=["Policy"],
    summary="Update Cryptographic Governance Policies",
)
async def update_policy(config: PolicyConfig):
    """
    Updates enterprise PQC compliance rules (NIST FIPS 203, FIPS 204,
    CI merge block gates, and CNSA 2.0 migration timelines).
    """
    global _CURRENT_POLICY
    import datetime
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    config.updated_at = now_iso
    _CURRENT_POLICY = config
    logger.info(
        f"Policy updated: FIPS-203={config.fips203_enabled}, "
        f"FIPS-204={config.fips204_enabled}, ShorBlock={config.block_shor_merges}"
    )
    return _CURRENT_POLICY

