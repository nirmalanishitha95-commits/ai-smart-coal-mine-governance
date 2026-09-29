import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from backend.app.database.session import get_db
from backend.app.models.models import Violation, Mine, CorrectiveAction, User
from backend.app.schemas.schemas import ViolationCreate, ViolationUpdate, ViolationResponse
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/violations", tags=["Violations"])

@router.get("", response_model=List[ViolationResponse])
def get_violations(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    query = db.query(Violation).join(Mine)

    if mine_id:
        query = query.filter(Violation.mine_id == mine_id)
    if status:
        query = query.filter(Violation.status == status.upper())
    if severity:
        query = query.filter(Violation.severity == severity.upper())
    if category:
        query = query.filter(Violation.category == category)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Violation.violation_code.ilike(search_fmt),
                Violation.description.ilike(search_fmt),
                Mine.name.ilike(search_fmt)
            )
        )

    viols = query.order_by(desc(Violation.detected_date)).offset(skip).limit(limit).all()

    result = []
    for v in viols:
        ca_count = db.query(CorrectiveAction).filter(CorrectiveAction.violation_id == v.id).count()
        result.append({
            "id": v.id,
            "violation_code": v.violation_code,
            "mine_id": v.mine_id,
            "mine_name": v.mine.name if v.mine else None,
            "inspection_id": v.inspection_id,
            "category": v.category,
            "description": v.description,
            "severity": v.severity,
            "detected_date": v.detected_date,
            "detected_by": v.detected_by,
            "status": v.status,
            "due_date": v.due_date,
            "assigned_officer": v.assigned_officer,
            "fine_amount": v.fine_amount,
            "corrective_actions_count": ca_count
        })
    return result

@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation_by_id(violation_id: int, db: Session = Depends(get_db)):
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")

    ca_count = db.query(CorrectiveAction).filter(CorrectiveAction.violation_id == v.id).count()
    return {
        "id": v.id,
        "violation_code": v.violation_code,
        "mine_id": v.mine_id,
        "mine_name": v.mine.name if v.mine else None,
        "inspection_id": v.inspection_id,
        "category": v.category,
        "description": v.description,
        "severity": v.severity,
        "detected_date": v.detected_date,
        "detected_by": v.detected_by,
        "status": v.status,
        "due_date": v.due_date,
        "assigned_officer": v.assigned_officer,
        "fine_amount": v.fine_amount,
        "corrective_actions_count": ca_count
    }

@router.post("", response_model=ViolationResponse)
def create_violation(
    violation_in: ViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "INSPECTOR"]))
):
    mine = db.query(Mine).filter(Mine.id == violation_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    v_code = f"VIO-{mine.code.split('-')[1]}-{uuid.uuid4().hex[:4].upper()}"
    new_v = Violation(
        violation_code=v_code,
        mine_id=violation_in.mine_id,
        inspection_id=violation_in.inspection_id,
        category=violation_in.category,
        description=violation_in.description,
        severity=violation_in.severity.upper(),
        detected_by=violation_in.detected_by or current_user.name,
        due_date=violation_in.due_date,
        assigned_officer=violation_in.assigned_officer or current_user.name,
        fine_amount=violation_in.fine_amount or 0.0,
        status="OPEN"
    )
    db.add(new_v)
    db.commit()
    db.refresh(new_v)

    log_audit_action(
        db=db,
        user=current_user,
        action="Violation Created",
        entity="Violation",
        entity_id=new_v.id,
        details=f"Violation '{new_v.violation_code}' issued for {mine.name} ({new_v.severity})."
    )

    return get_violation_by_id(new_v.id, db)

@router.put("/{violation_id}", response_model=ViolationResponse)
def update_violation(
    violation_id: int,
    violation_in: ViolationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "MINE_MANAGER", "INSPECTOR"]))
):
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")

    if violation_in.status:
        v.status = violation_in.status.upper()
    if violation_in.severity:
        v.severity = violation_in.severity.upper()
    if violation_in.assigned_officer:
        v.assigned_officer = violation_in.assigned_officer
    if violation_in.due_date:
        v.due_date = violation_in.due_date
    if violation_in.fine_amount is not None:
        v.fine_amount = violation_in.fine_amount
    if violation_in.description:
        v.description = violation_in.description

    db.commit()
    db.refresh(v)

    log_audit_action(
        db=db,
        user=current_user,
        action="Violation Updated",
        entity="Violation",
        entity_id=v.id,
        details=f"Violation {v.violation_code} status updated to {v.status}."
    )

    return get_violation_by_id(v.id, db)
