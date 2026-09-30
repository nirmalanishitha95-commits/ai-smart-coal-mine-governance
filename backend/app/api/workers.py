from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Worker, Mine, Hazard, RescueTeam, RescueOperation, AuditLog

router = APIRouter(prefix="/workers", tags=["Underground Worker Safety"])


class WorkerStatusUpdate(BaseModel):
    status: str
    assigned_zone: Optional[str] = None


class StartRescuePayload(BaseModel):
    team_id: Optional[int] = None
    notes: Optional[str] = None


def normalize_worker_status(raw_status: str) -> str:
    """Standardizes worker status into the 6 official states: SAFE, WARNING, AT RISK, EMERGENCY, EVACUATED, RESCUED."""
    s = (raw_status or "SAFE").upper().strip()
    if s in ["IN_HAZARD_ZONE", "UNACCOUNTED", "DANGER", "CRITICAL"]:
        return "EMERGENCY"
    if s in ["EVACUATING", "AT_RISK", "RISK"]:
        return "AT RISK"
    if s in ["SAFE", "WARNING", "AT RISK", "EMERGENCY", "EVACUATED", "RESCUED"]:
        return s
    return "SAFE"


def resolve_worker_hazard(worker: Worker, db: Session) -> Dict[str, Any]:
    """Finds active hazard for the worker's mine and zone or provides zone hazard context."""
    hz = db.query(Hazard).filter(
        Hazard.mine_id == worker.mine_id,
        Hazard.status == "ACTIVE"
    ).first()

    zone = worker.assigned_zone or "Main Shaft"

    zone_hazards = {
        "Coal Face": "Methane Gas Inundation (CH4: 2.85%) - Flammable Accumulation",
        "Ventilation Zone": "Ventilation Airway Stoppage (CO: 62 ppm) - Inadequate Fresh Air",
        "Conveyor Zone": "Belt Roller Friction & Elevated Dust (PM10: 240 µg/m³)",
        "Tunnel": "Strata Instability & Low Airflow (8.2 m³/min)",
        "Equipment Area": "High Temperature (41.5°C) & Heavy Machinery Electrical Load",
        "Main Shaft": "Shaft Head Hoist Maintenance Advisory",
        "Emergency Exit": "Escape Way Clear & Pressurized",
        "Rescue Assembly Area": "Rescue Staging Base (Nominal)"
    }

    status = normalize_worker_status(worker.status)

    if status == "EMERGENCY":
        hazard_desc = hz.hazard_type if hz else zone_hazards.get(zone, "Severe Underground Atmospheric Hazard")
        risk_level = "CRITICAL"
        risk_score = 92.0
        emergency_status = "CRITICAL DANGER — IMMEDIATE EXTRACTION REQUIRED"
    elif status == "AT RISK":
        hazard_desc = hz.hazard_type if hz else zone_hazards.get(zone, "Hazard Zone Proximity — High Gas Exposure")
        risk_level = "HIGH"
        risk_score = 74.0
        emergency_status = "HAZARD ESCALATION — STANDBY RESCUE DISPATCH"
    elif status == "WARNING":
        hazard_desc = zone_hazards.get(zone, "Elevated Parameter Drift (Advisory)")
        risk_level = "MEDIUM"
        risk_score = 48.0
        emergency_status = "ELEVATED READINGS — PREVENTATIVE MONITORING"
    elif status == "EVACUATED":
        hazard_desc = "Evacuated from Hazard Zone"
        risk_level = "LOW"
        risk_score = 22.0
        emergency_status = "EVACUATION COMPLETE — SAFELY AT REFUGE / SURFACE"
    elif status == "RESCUED":
        hazard_desc = "Extracted by Mine Rescue Squad"
        risk_level = "LOW"
        risk_score = 10.0
        emergency_status = "RESCUED SAFELY — MEDICAL TRIAGE CLEAR"
    else:
        hazard_desc = "Nominal Atmosphere — No Active Hazard"
        risk_level = "LOW"
        risk_score = 14.0
        emergency_status = "OPERATIONAL — NORMAL SHIFT WORK"

    return {
        "hazard_desc": hazard_desc,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "emergency_status": emergency_status
    }


def serialize_worker(w: Worker, db: Session) -> Dict[str, Any]:
    norm_status = normalize_worker_status(w.status)
    h_info = resolve_worker_hazard(w, db)

    # Affected workers count in the same mine and zone
    affected_count = db.query(Worker).filter(
        Worker.mine_id == w.mine_id,
        Worker.assigned_zone == w.assigned_zone
    ).count() or 1

    # Team assignment
    team = db.query(RescueTeam).filter(RescueTeam.base_mine_id == w.mine_id).first()
    if not team:
        team = db.query(RescueTeam).first()

    team_name = team.team_name if team else "DGMS Quick Response Rescue Squad Alpha"
    leader_name = team.leader_name if team else "Capt. A. K. Verma"
    team_spec = team.specialization if team else "Underground Atmospheric Extraction & SCBA Penetration"

    # Rescue status
    if norm_status == "RESCUED":
        rescue_status = "RESCUED"
    elif norm_status == "EVACUATED":
        rescue_status = "EVACUATED"
    elif norm_status == "EMERGENCY":
        rescue_status = "RESCUE IN PROGRESS"
    elif norm_status == "AT RISK":
        rescue_status = "RESCUE SQUAD DISPATCHED"
    elif norm_status == "WARNING":
        rescue_status = "RESCUE STANDBY"
    else:
        rescue_status = "STANDBY"

    # 7-Step Rescue Workflow Timeline
    timeline = [
        {
            "step": 1,
            "label": "HAZARD DETECTED",
            "status": "COMPLETED",
            "time": "12 mins ago",
            "detail": f"Multi-gas telemetry detected critical anomaly: {h_info['hazard_desc']}"
        },
        {
            "step": 2,
            "label": "WORKER IDENTIFIED",
            "status": "COMPLETED",
            "time": "10 mins ago",
            "detail": f"Miner RFID & telemetry beacon localized in underground sector {w.assigned_zone}"
        },
        {
            "step": 3,
            "label": "ALERT GENERATED",
            "status": "COMPLETED",
            "time": "8 mins ago",
            "detail": f"Priority 1 Emergency Evacuation Alarm broadcast to {w.name} ({w.worker_code})"
        },
        {
            "step": 4,
            "label": "RESCUE TEAM ASSIGNED",
            "status": "COMPLETED" if norm_status in ["AT RISK", "EMERGENCY", "EVACUATED", "RESCUED"] else "PENDING",
            "time": "5 mins ago",
            "detail": f"Assigned: {team_name} (Lead: {leader_name}) with SCBA 4-hour rebreathers"
        },
        {
            "step": 5,
            "label": "RESCUE IN PROGRESS",
            "status": "COMPLETED" if norm_status in ["EVACUATED", "RESCUED"] else ("ACTIVE" if norm_status == "EMERGENCY" else "PENDING"),
            "time": "2 mins ago" if norm_status in ["EMERGENCY", "EVACUATED", "RESCUED"] else "--",
            "detail": f"Rescue squad entering cross-cut gallery towards {w.assigned_zone}"
        },
        {
            "step": 6,
            "label": "EVACUATED",
            "status": "COMPLETED" if norm_status in ["EVACUATED", "RESCUED"] else "PENDING",
            "time": "Just now" if norm_status in ["EVACUATED", "RESCUED"] else "--",
            "detail": "Worker successfully extracted through fresh-air intake intake drift"
        },
        {
            "step": 7,
            "label": "RESCUED",
            "status": "COMPLETED" if norm_status == "RESCUED" else "PENDING",
            "time": "Just now" if norm_status == "RESCUED" else "--",
            "detail": "Worker safely surfaced at pithead emergency triage station"
        }
    ]

    return {
        "id": w.id,
        "worker_code": w.worker_code,
        "name": w.name,
        "role": w.role,
        "mine_id": w.mine_id,
        "mine_name": w.mine.name if w.mine else "Underground Colliery",
        "assigned_zone": w.assigned_zone or "Main Shaft",
        "current_hazard": h_info["hazard_desc"],
        "risk_level": h_info["risk_level"],
        "risk_score": h_info["risk_score"],
        "safety_status": norm_status,
        "status": norm_status,
        "last_known_location": f"DEMO WORKER LOCATION — {w.assigned_zone or 'Main Shaft'} (Sub-Level 2, Stope 4B)",
        "emergency_status": h_info["emergency_status"],
        "assigned_rescue_team": team_name,
        "rescue_team_leader": leader_name,
        "rescue_team_specialization": team_spec,
        "rescue_status": rescue_status,
        "affected_workers_count": affected_count,
        "heart_rate": w.heart_rate or 78.0,
        "body_temperature": w.body_temperature or 36.8,
        "battery_level": w.battery_level or 90.0,
        "last_beacon": w.last_beacon.isoformat() if w.last_beacon else datetime.now(timezone.utc).isoformat(),
        "location_mode": "DEMO WORKER LOCATION",
        "rescue_timeline": timeline
    }


@router.get("")
def get_workers(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Worker).outerjoin(Mine)
    if mine_id:
        query = query.filter(Worker.mine_id == mine_id)
    if zone:
        query = query.filter(Worker.assigned_zone == zone)

    workers = query.all()
    results = [serialize_worker(w, db) for w in workers]

    if status:
        target = status.upper().strip()
        results = [r for r in results if r["safety_status"] == target]

    return results


@router.get("/in-danger")
def get_workers_in_danger(
    mine_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns only workers currently in danger (EMERGENCY, AT RISK, or WARNING).
    Essential for the prominent 'WORKERS IN DANGER' section.
    """
    query = db.query(Worker).outerjoin(Mine)
    if mine_id:
        query = query.filter(Worker.mine_id == mine_id)

    workers = query.all()
    serialized = [serialize_worker(w, db) for w in workers]

    # Filter to only dangerous workers
    in_danger = [
        w for w in serialized
        if w["safety_status"] in ["EMERGENCY", "AT RISK", "WARNING"]
    ]

    # Sort so EMERGENCY is first, then AT RISK, then WARNING
    priority_order = {"EMERGENCY": 0, "AT RISK": 1, "WARNING": 2}
    in_danger.sort(key=lambda x: priority_order.get(x["safety_status"], 3))

    return in_danger


@router.get("/summary")
def get_worker_safety_summary(db: Session = Depends(get_db)):
    workers = db.query(Worker).all()
    total = len(workers)
    statuses = [normalize_worker_status(w.status) for w in workers]

    return {
        "total_monitored": total,
        "safe_count": statuses.count("SAFE"),
        "warning_count": statuses.count("WARNING"),
        "at_risk_count": statuses.count("AT RISK"),
        "emergency_count": statuses.count("EMERGENCY"),
        "evacuated_count": statuses.count("EVACUATED"),
        "rescued_count": statuses.count("RESCUED"),
        "in_danger_count": statuses.count("EMERGENCY") + statuses.count("AT RISK") + statuses.count("WARNING"),
        "location_mode": "DEMO WORKER LOCATION",
        "notice": "Personnel location tracking tagged as DEMO WORKER LOCATION."
    }


@router.post("/{worker_id}/rescue")
def start_worker_rescue(
    worker_id: int,
    payload: StartRescuePayload,
    db: Session = Depends(get_db)
):
    """
    Executes rescue action for a worker in danger:
    Advances the rescue workflow to RESCUED (or EVACUATED), assigns rescue squad, and records audit trail.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker record not found")

    # Move status to RESCUED
    previous_status = normalize_worker_status(worker.status)
    worker.status = "RESCUED"
    worker.heart_rate = 78.0
    worker.body_temperature = 36.8
    worker.last_beacon = datetime.now(timezone.utc)

    # Find or assign team
    team = None
    if payload.team_id:
        team = db.query(RescueTeam).filter(RescueTeam.id == payload.team_id).first()
    if not team:
        team = db.query(RescueTeam).filter(RescueTeam.base_mine_id == worker.mine_id).first()
    if not team:
        team = db.query(RescueTeam).first()

    # Log to audit trail
    audit_entry = AuditLog(
        entity="Worker",
        entity_id=worker.id,
        action="WORKER_RESCUED",
        user_email="system@minesafe.gov.in",
        details=f"Worker {worker.name} ({worker.worker_code}) successfully extracted from {worker.assigned_zone} by {team.team_name if team else 'Rescue Squad Alpha'}. Status updated from {previous_status} to RESCUED."
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(worker)

    return {
        "status": "success",
        "message": f"Rescue operation completed for {worker.name} ({worker.worker_code}).",
        "worker": serialize_worker(worker, db)
    }


@router.put("/{worker_id}/status")
def update_worker_status(
    worker_id: int,
    payload: WorkerStatusUpdate,
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker record not found")

    worker.status = normalize_worker_status(payload.status)
    if payload.assigned_zone:
        worker.assigned_zone = payload.assigned_zone
    worker.last_beacon = datetime.now(timezone.utc)
    db.commit()

    return {"status": "success", "worker_code": worker.worker_code, "new_status": worker.status}

