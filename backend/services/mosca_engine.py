from backend.models.schemas import MoscaRequest, MoscaResponse, DashboardSummary

def calculate_mosca(req: MoscaRequest) -> MoscaResponse:
    X = req.data_shelf_life_years
    Y = req.migration_horizon_years
    Z = req.crqc_timeline_years
    total_needed = X + Y
    deficit = total_needed - Z
    is_compromised = total_needed > Z

    if is_compromised:
        status = "COMPROMISED STATUS: ACTIVE EXPOSURE"
        rationale = (
            f"Mosca's Inequality (X + Y > Z) is violated: Data confidentiality shelf-life ({X:.1f}y) "
            f"plus migration time ({Y:.1f}y) equals {total_needed:.1f} years, exceeding the quantum timeline "
            f"({Z:.1f} years until CRQC). Adversaries can harvest ciphertexts today and decrypt them {deficit:.1f} years "
            f"before confidentiality obligations expire."
        )
    else:
        status = "SECURE STATUS: SAFE HORIZON"
        rationale = (
            f"Mosca's Inequality is satisfied: Total needed migration and secrecy time ({total_needed:.1f}y) "
            f"is within the {Z:.1f}-year quantum horizon."
        )

    return MoscaResponse(
        data_shelf_life_years=X,
        migration_horizon_years=Y,
        crqc_timeline_years=Z,
        total_needed_window_years=total_needed,
        deficit_window_years=max(0.0, deficit),
        is_compromised=is_compromised,
        status=status,
        hndl_threat_active=is_compromised,
        rationale=rationale
    )

calculate_mosca_theorem = calculate_mosca

def get_dashboard_summary(mosca_req: MoscaRequest = MoscaRequest()) -> DashboardSummary:
    from backend.services.pqc_remediator import get_migration_stats
    stats = get_migration_stats()
    mosca_res = calculate_mosca(mosca_req)
    return DashboardSummary(
        mosca=mosca_res,
        total_assets=4821,
        monitored_repos_pods=87,
        shor_vulnerable_critical=142,
        grover_vulnerable_medium=89,
        pqc_migration_progress=stats["progress_percent"],
        pqc_migrated_count=stats["migrated_count"],
        compliance_mode="NIST FIPS 203/204 Enforced"
    )
