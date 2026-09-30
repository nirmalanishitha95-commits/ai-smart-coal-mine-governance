from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import Hazard, Mine

router = APIRouter(prefix="/hazards", tags=["Underground Hazard Detection"])

class HazardCreate(BaseModel):
    mine_id: int
    zone_name: str
    hazard_type: str
    severity: str = "HIGH"
    risk_score: float = 75.0
    description: str
    recommended_action: str

@router.get("")
def get_hazards(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Hazard).outerjoin(Mine)
    if mine_id:
        query = query.filter(Hazard.mine_id == mine_id)
    if status:
        query = query.filter(Hazard.status == status.upper())
    if severity:
        query = query.filter(Hazard.severity == severity.upper())

    hazards = query.order_by(desc(Hazard.detected_at)).all()
    return [
        {
            "id": h.id,
            "hazard_code": h.hazard_code,
            "mine_id": h.mine_id,
            "mine_name": h.mine.name if h.mine else "Colliery",
            "zone_name": h.zone_name,
            "hazard_type": h.hazard_type,
            "severity": h.severity,
            "risk_score": h.risk_score,
            "description": h.description,
            "recommended_action": h.recommended_action,
            "detected_by": h.detected_by,
            "status": h.status,
            "detected_at": h.detected_at.isoformat() if h.detected_at else None,
            "resolved_at": h.resolved_at.isoformat() if h.resolved_at else None
        }
        for h in hazards
    ]

@router.post("")
def create_hazard(payload: HazardCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    count = db.query(Hazard).count() + 1
    code = f"HAZ-{payload.zone_name[:3].upper()}-{count:03d}"

    hazard = Hazard(
        hazard_code=code,
        mine_id=payload.mine_id,
        zone_name=payload.zone_name,
        hazard_type=payload.hazard_type,
        severity=payload.severity.upper(),
        risk_score=payload.risk_score,
        description=payload.description,
        recommended_action=payload.recommended_action,
        detected_by="AI MineSafe Real-Time Engine",
        status="ACTIVE",
        detected_at=now
    )
    db.add(hazard)
    db.commit()
    db.refresh(hazard)

    return {"status": "success", "hazard_code": hazard.hazard_code, "id": hazard.id}

@router.put("/{hazard_id}/resolve")
def resolve_hazard(hazard_id: int, db: Session = Depends(get_db)):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")

    hazard.status = "RESOLVED"
    hazard.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "success", "hazard_status": hazard.status}
