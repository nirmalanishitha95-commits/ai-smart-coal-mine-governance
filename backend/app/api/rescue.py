from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import RescueOperation, RescueTeam, Mine, SafetyIncident, User
from backend.app.services.auth_service import get_current_user_optional
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/rescue", tags=["Rescue Operations & Emergency Management"])

class RescueOperationCreate(BaseModel):
    mine_id: int
    title: str
    hazard_type: str
    affected_zone: str
    workers_at_risk: int = 0
    severity: str = "HIGH"
    lead_commander: Optional[str] = "DGMS Mine Rescue Superintendent"
    action_log: Optional[str] = "Emergency rescue deployed by AI MineSafe protocol."

class RescueStatusUpdate(BaseModel):
    status: str
    action_log_entry: Optional[str] = None
    evacuated_count: Optional[int] = None

@router.get("/operations")
def get_rescue_operations(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RescueOperation).outerjoin(Mine).outerjoin(RescueTeam)
    if mine_id:
        query = query.filter(RescueOperation.mine_id == mine_id)
    if status:
        query = query.filter(RescueOperation.status == status.upper())

    ops = query.order_by(desc(RescueOperation.created_at)).all()
    result = []
    for op in ops:
        result.append({
            "id": op.id,
            "operation_code": op.operation_code,
            "mine_id": op.mine_id,
            "mine_name": op.mine.name if op.mine else "Colliery",
            "team_id": op.team_id,
            "team_name": op.team.team_name if op.team else "Mine Rescue Taskforce",
            "title": op.title,
            "hazard_type": op.hazard_type,
            "affected_zone": op.affected_zone,
            "workers_at_risk": op.workers_at_risk,
            "evacuated_count": op.evacuated_count,
            "status": op.status,
            "severity": op.severity,
            "lead_commander": op.lead_commander,
            "action_log": op.action_log,
            "created_at": op.created_at.isoformat() if op.created_at else None,
            "resolved_at": op.resolved_at.isoformat() if op.resolved_at else None
        })
    return result

@router.post("/operations")
def create_rescue_operation(
    payload: RescueOperationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    now = datetime.now(timezone.utc)
    op_code = f"RES-{now.strftime('%Y%m%d')}-{db.query(RescueOperation).count() + 1:03d}"
    
    first_team = db.query(RescueTeam).filter(RescueTeam.status == "STANDBY").first()
    if not first_team:
        first_team = db.query(RescueTeam).first()

    op = RescueOperation(
        operation_code=op_code,
        mine_id=payload.mine_id,
        team_id=first_team.id if first_team else None,
        title=payload.title,
        hazard_type=payload.hazard_type,
        affected_zone=payload.affected_zone,
        workers_at_risk=payload.workers_at_risk,
        evacuated_count=0,
        status="ACTIVE",
        severity=payload.severity.upper(),
        lead_commander=payload.lead_commander or "DGMS Mine Rescue Superintendent",
        action_log=f"[{now.strftime('%H:%M:%S UTC')}] Operation initiated: {payload.action_log}"
    )
    db.add(op)
    db.commit()
    db.refresh(op)

    if current_user:
        log_audit_action(
            db=db,
            user=current_user,
            action="Create Rescue Operation",
            entity="RescueOperation",
            entity_id=op.id,
            details=f"Rescue operation {op.operation_code} created for {payload.affected_zone}."
        )

    return {
        "status": "success",
        "operation_code": op.operation_code,
        "id": op.id,
        "message": f"Emergency rescue operation {op_code} activated."
    }

@router.put("/operations/{op_id}/status")
def update_rescue_status(
    op_id: int,
    payload: RescueStatusUpdate,
    db: Session = Depends(get_db)
):
    op = db.query(RescueOperation).filter(RescueOperation.id == op_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Rescue operation not found")

    now = datetime.now(timezone.utc)
    op.status = payload.status.upper()
    if payload.evacuated_count is not None:
        op.evacuated_count = payload.evacuated_count
    if payload.action_log_entry:
        entry = f"\n[{now.strftime('%H:%M:%S UTC')}] {payload.action_log_entry}"
        op.action_log = (op.action_log or "") + entry

    if op.status == "RESOLVED":
        op.resolved_at = now

    db.commit()
    return {"status": "success", "operation_status": op.status}

@router.get("/teams")
def get_rescue_teams(db: Session = Depends(get_db)):
    teams = db.query(RescueTeam).all()
    return [
        {
            "id": t.id,
            "team_code": t.team_code,
            "team_name": t.team_name,
            "leader_name": t.leader_name,
            "member_count": t.member_count,
            "specialization": t.specialization,
            "equipment": t.equipment,
            "status": t.status,
            "current_zone": t.current_zone,
            "contact_freq": t.contact_freq
        }
        for t in teams
    ]
