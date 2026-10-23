import urllib.request, json

BASE = "http://127.0.0.1:8000/api/v1"

def get(path):
    r = urllib.request.urlopen(BASE + path)
    return json.loads(r.read())

def post(path, body):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    r = urllib.request.urlopen(req)
    return json.loads(r.read())

print("=== Q-SHIELD ENDPOINT VERIFICATION ===")

h = get("/health")
print(f"[OK] Health: {h['status']} | FIPS: {h['fips_standard']} | PQC Progress: {h['pqc_migration_progress_percent']}%")

s = get("/dashboard/summary")
print(f"[OK] Dashboard: {s['total_assets']} assets | Shor: {s['shor_vulnerable_critical']} | Grover: {s['grover_vulnerable_medium']} | Migration: {s['pqc_migration_progress']}%")
print(f"     Mosca: is_compromised={s['mosca']['is_compromised']} | deficit={s['mosca']['deficit_window_years']}y")

cbom = get("/cbom/inventory")
print(f"[OK] CBOM Inventory: {len(cbom)} items | First: {cbom[0]['asset_name']} ({cbom[0]['risk_category']})")

qkd_n = post("/qkd/simulate", {"eve_active": False, "n_qubits": 64})
print(f"[OK] QKD Normal (no Eve): QBER={qkd_n['live_qber']}% | State: {qkd_n['channel_state']} | Key: {qkd_n['sifted_key_hex'][:16]}...")

qkd_e = post("/qkd/simulate", {"eve_active": True, "n_qubits": 64})
print(f"[OK] QKD+Eve Active: QBER={qkd_e['live_qber']}% | State: {qkd_e['channel_state']}")
print(f"     Alert: {qkd_e['alert_message'][:80] if qkd_e['alert_message'] else 'None'}...")

pr = post("/remediate/pr", {"file_path": "src/crypto/db_encryption.go", "repo": "fintech/core-ledger"})
print(f"[OK] PR Gen: #{pr['pr_number']} | {pr['vulnerable_cipher']} -> {pr['migrated_cipher']}")
print(f"     Branch: {pr['branch']}")

proxy = post("/remediate/proxy", {"cluster_name": "prod-us-east-1", "target_service": "payments-core"})
print(f"[OK] Proxy Deploy: {proxy['status']}")
print(f"     SharedSecret: {proxy['derived_shared_secret_prefix']}")
print(f"     Progress: {proxy['updated_progress_percent']}%")
print(f"     Log lines: {len(proxy['terminal_logs'])}")

export = get("/cbom/export")
print(f"[OK] CBOM CycloneDX Export: format={export['bomFormat']} v{export['specVersion']} | assets={len(export['cryptographicAssets'])}")

policy = get("/policy")
print(f"[OK] Policy Get: FIPS-203={policy['fips203_enabled']} | FIPS-204={policy['fips204_enabled']} | Mode={policy['enforcement_mode']}")

updated_policy = post("/policy", {
    "fips203_enabled": True,
    "fips204_enabled": True,
    "block_shor_merges": True,
    "cnsa2_timeline": "2030-strict",
    "enforcement_mode": "Strict",
})
print(f"[OK] Policy Update: UpdatedAt={updated_policy['updated_at']}")

print()
print("=== ALL ENDPOINTS PASSING ===")
