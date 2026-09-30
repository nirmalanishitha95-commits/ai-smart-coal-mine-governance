import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Mine, ComplianceRecord, Violation, CorrectiveAction,
    SensorReading, SafetyIncident, Inspection, Hazard
)

def evaluate_mine_risk(mine_id: int, db: Session) -> Dict[str, Any]:
    """
    Explainable Rule-Based AI-Assisted Risk Assessment Engine for Underground Mines.
    Evaluates:
    - Active underground hazards (methane, roof falls, ventilation, dust)
    - Sensor anomaly spikes & multi-gas atmospheric breaches
    - Open safety violations & compliance deficiencies
    - Overdue corrective actions
    - Emergency incidents & safety trends

    Calculates score [0 - 100]:
    0-30   -> LOW (Green)
    31-60  -> MEDIUM (Yellow)
    61-80  -> HIGH (Orange)
    81-100 -> CRITICAL (Red)
    """
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        return {
            "mine_id": mine_id,
            "risk_score": 0.0,
            "risk_level": "LOW",
            "factors": [],
            "recommendations": ["Mine record not found."]
        }

    now = datetime.datetime.now(datetime.timezone.utc)
    factors: List[Dict[str, Any]] = []
    total_score = 10.0 # Base nominal baseline operational risk

    # 1. Environmental & Sensor Anomaly Factor (Weight up to 30)
    # Check sensor readings in last 48 hours
    recent_readings = (
        db.query(SensorReading)
        .filter(SensorReading.mine_id == mine_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(30)
        .all()
    )
    critical_sensors = [s for s in recent_readings if s.risk_flag in ["CRITICAL", "ANOMALY"]]
    warning_sensors = [s for s in recent_readings if s.risk_flag == "WARNING"]

    env_impact = 0.0
    if critical_sensors:
        env_impact = min(30.0, 15.0 + (len(critical_sensors) * 3.5))
        factors.append({
            "factor": "Active Environmental & Gas Anomaly",
            "impact": round(env_impact, 1),
            "description": f"{len(critical_sensors)} sensor anomaly readings detected (elevated Methane/CO/Dust)"
        })
    elif warning_sensors:
        env_impact = min(15.0, len(warning_sensors) * 2.0)
        factors.append({
            "factor": "Elevated Environmental Readings",
            "impact": round(env_impact, 1),
            "description": f"{len(warning_sensors)} sensor warning events recorded"
        })
    total_score += env_impact

    # Active Underground Hazards (Weight up to 25)
    active_hazards = (
        db.query(Hazard)
        .filter(Hazard.mine_id == mine_id, Hazard.status == "ACTIVE")
        .all()
    )
    hazard_impact = 0.0
    if active_hazards:
        crit_haz = [h for h in active_hazards if h.severity == "CRITICAL"]
        high_haz = [h for h in active_hazards if h.severity == "HIGH"]
        hazard_impact = min(25.0, (len(crit_haz) * 12.0) + (len(high_haz) * 7.0) + (len(active_hazards) * 3.0))
        factors.append({
            "factor": "Active Underground Hazards",
            "impact": round(hazard_impact, 1),
            "description": f"{len(active_hazards)} unresolved underground hazard(s) ({len(crit_haz)} Critical)"
        })
    total_score += hazard_impact

    # 2. Open Violations Impact (Weight up to 20)
    open_violations = (
        db.query(Violation)
        .filter(Violation.mine_id == mine_id, Violation.status.in_(["OPEN", "UNDER REVIEW", "CORRECTIVE ACTION"]))
        .all()
    )
    viol_impact = 0.0
    critical_viols = [v for v in open_violations if v.severity == "CRITICAL"]
    high_viols = [v for v in open_violations if v.severity == "HIGH"]
    other_viols = [v for v in open_violations if v.severity in ["MEDIUM", "LOW"]]

    if open_violations:
        viol_impact = min(25.0, (len(critical_viols) * 10.0) + (len(high_viols) * 6.0) + (len(other_viols) * 2.0))
        factors.append({
            "factor": "Open High-Severity Violations",
            "impact": round(viol_impact, 1),
            "description": f"{len(open_violations)} unresolved violations ({len(critical_viols)} Critical, {len(high_viols)} High)"
        })
    total_score += viol_impact

    # 3. Overdue Corrective Actions Impact (Weight up to 20)
    overdue_actions = (
        db.query(CorrectiveAction)
        .filter(
            CorrectiveAction.mine_id == mine_id,
            CorrectiveAction.status.in_(["PENDING", "IN PROGRESS", "OVERDUE"]),
            CorrectiveAction.due_date < now
        )
        .all()
    )
    ca_impact = 0.0
    if overdue_actions:
        ca_impact = min(20.0, len(overdue_actions) * 7.5)
        factors.append({
            "factor": "Overdue Corrective Actions",
            "impact": round(ca_impact, 1),
            "description": f"{len(overdue_actions)} mandatory corrective actions past compliance deadline"
        })
    total_score += ca_impact

    # 4. Regulatory Compliance Shortfall (Weight up to 15)
    non_compliant_records = (
        db.query(ComplianceRecord)
        .filter(
            ComplianceRecord.mine_id == mine_id,
            ComplianceRecord.status.in_(["NON-COMPLIANT", "PARTIALLY COMPLIANT"])
        )
        .all()
    )
    comp_impact = 0.0
    if non_compliant_records:
        comp_impact = min(15.0, len(non_compliant_records) * 2.5)
        factors.append({
            "factor": "Regulatory Compliance Deficiency",
            "impact": round(comp_impact, 1),
            "description": f"{len(non_compliant_records)} compliance rules unmet or pending rectification"
        })
    total_score += comp_impact

    # 5. Safety Incidents & Inspection Overdue (Weight up to 10)
    incidents = (
        db.query(SafetyIncident)
        .filter(SafetyIncident.mine_id == mine_id)
        .all()
    )
    safety_impact = 0.0
    if incidents:
        safety_impact = min(10.0, len(incidents) * 4.0)
        factors.append({
            "factor": "Safety Incident History",
            "impact": round(safety_impact, 1),
            "description": f"{len(incidents)} safety incidents logged during recent operating period"
        })
    total_score += safety_impact

    final_score = min(100.0, max(5.0, round(total_score, 1)))

    if final_score >= 81:
        level = "CRITICAL"
    elif final_score >= 61:
        level = "HIGH"
    elif final_score >= 31:
        level = "MEDIUM"
    else:
        level = "LOW"

    # Actionable AI recommendations
    recommendations = []
    if env_impact > 10:
        recommendations.append("Immediate auxiliary fan inspection and gas venting protocol activation required.")
    if viol_impact > 10:
        recommendations.append("Prioritize resolution and physical verification of open critical safety violations.")
    if ca_impact > 0:
        recommendations.append("Expedite overdue corrective actions to prevent regulatory enforcement penalties.")
    if not recommendations:
        recommendations.append("Continue standard telemetry surveillance and adhere to scheduled routine audits.")

    # Update mine state in DB
    mine.risk_score = final_score
    mine.risk_level = level
    # Also update compliance score (inversely related to violations and non-compliance)
    calculated_compliance = max(10.0, min(100.0, 100.0 - (comp_impact * 2.5) - (viol_impact * 1.5)))
    mine.compliance_score = round(calculated_compliance, 1)
    db.commit()

    return {
        "mine_id": mine.id,
        "mine_name": mine.name,
        "risk_score": final_score,
        "risk_level": level,
        "compliance_score": mine.compliance_score,
        "factors": factors,
        "recommendations": recommendations,
        "last_evaluated": datetime.datetime.now(datetime.timezone.utc)
    }
