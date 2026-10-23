from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# Mosca's Theorem Models
# ---------------------------------------------------------
class MoscaRequest(BaseModel):
    data_shelf_life_years: float = Field(default=15.0, description="Parameter X: Data secrecy/confidentiality requirement in years")
    migration_horizon_years: float = Field(default=3.0, description="Parameter Y: Time needed to migrate enterprise stack to PQC in years")
    crqc_timeline_years: float = Field(default=7.0, description="Parameter Z: Time until Cryptanalytically Relevant Quantum Computer emerges")

class MoscaResponse(BaseModel):
    data_shelf_life_years: float
    migration_horizon_years: float
    crqc_timeline_years: float
    total_needed_window_years: float
    deficit_window_years: float
    is_compromised: bool
    status: str
    hndl_threat_active: bool
    rationale: str

class DashboardSummary(BaseModel):
    mosca: MoscaResponse
    total_assets: int = 4821
    monitored_repos_pods: int = 87
    shor_vulnerable_critical: int = 142
    grover_vulnerable_medium: int = 89
    pqc_migration_progress: float = 18.4
    pqc_migrated_count: int = 41
    compliance_mode: str = "NIST FIPS 203/204 Enforced"

# ---------------------------------------------------------
# CBOM Inventory Models (CycloneDX 1.6 & SPDX 3.0 compatible)
# ---------------------------------------------------------
class CbomItemSchema(BaseModel):
    id: str
    asset_name: str
    service: str
    repo: str
    file_path: str
    line_number: int
    current_algorithm: str
    algorithm_type: Literal["Asymmetric", "Symmetric", "Hash / Signature", "Key Exchange"]
    key_length: str
    risk_category: Literal["Shor's Vulnerable", "Grover's Vulnerable", "Deprecated", "PQC Compliant"]
    recommended_pqc: str
    pqc_standard: str
    impact_severity: float = Field(..., ge=0.0, le=10.5)
    ease_of_exploitation: float = Field(..., ge=0.0, le=10.5)
    location_type: str
    status: Literal["Exposed", "Remediation Staged", "Migrated"]
    code_snippet: str
    remediation_snippet: str
    data_shelf_life_years: int

class CbomScanRequest(BaseModel):
    target_type: Literal["code_snippet", "tls_endpoint", "local_file"] = "code_snippet"
    target: str = Field(..., description="File path, URL/host, or label")
    code_snippet: Optional[str] = None
    service_name: Optional[str] = "custom-service"

class CbomScanResponse(BaseModel):
    target: str
    target_type: str
    scanned_primitives: int
    new_findings: List[CbomItemSchema]
    message: str

# ---------------------------------------------------------
# Remediation Engine Models
# ---------------------------------------------------------
class RemediatePrRequest(BaseModel):
    asset_id: Optional[str] = None
    file_path: Optional[str] = "src/crypto/db_encryption.go"
    repo: Optional[str] = "fintech/core-ledger"
    target_pqc: Optional[str] = "ML-KEM-768"

class RemediatePrResponse(BaseModel):
    pr_number: int
    title: str
    repo: str
    branch: str
    author: str
    vulnerable_cipher: str
    migrated_cipher: str
    unified_diff: str
    ci_status: str
    nist_compliance: str
    created_at: str
    status: str

class RemediateProxyRequest(BaseModel):
    cluster_name: str = "prod-us-east-1"
    pod_name: str = "payments-api-7b49cf52"
    target_service: str = "payments-core"
    hybrid_kex: str = "X25519_MLKEM768"

class RemediateProxyResponse(BaseModel):
    status: str
    sidecar_image: str
    tunnel_ciphers: str
    derived_shared_secret_prefix: str
    sidecar_yaml: str
    terminal_logs: List[str]
    updated_progress_percent: float

# ---------------------------------------------------------
# QKD BB84 Simulator Models
# ---------------------------------------------------------
class PhotonBasisEntry(BaseModel):
    index: int
    alice_bit: int
    alice_basis: str
    eve_intercepted: bool
    eve_basis: Optional[str] = None
    bob_basis: str
    bob_measured: int
    bases_matched: bool
    is_error: bool
    kept_in_sifted_key: bool

class QkdSimulateRequest(BaseModel):
    eve_active: bool = False
    n_qubits: int = Field(default=64, ge=16, le=256)
    fiber_distance_km: float = 42.0

class QkdSimulateResponse(BaseModel):
    time_iso: str
    live_qber: float
    threshold_qber: float = 11.0
    channel_state: str
    raw_key_rate_kbps: int
    sifted_key_rate_kbps: int
    secret_key_rate_bps: int
    purged_key_blocks: int
    bell_state_fidelity: float
    eve_active: bool
    sifted_key_hex: str
    alert_message: Optional[str] = None
    photon_sample: List[PhotonBasisEntry]

# ---------------------------------------------------------
# Cryptographic Policy & Governance Models
# ---------------------------------------------------------
class PolicyConfig(BaseModel):
    fips203_enabled: bool = True
    fips204_enabled: bool = True
    block_shor_merges: bool = True
    cnsa2_timeline: str = "2030-strict"
    enforcement_mode: str = "Strict"
    updated_at: Optional[str] = None

