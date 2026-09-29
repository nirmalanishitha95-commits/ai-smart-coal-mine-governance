import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.models import CorrectiveAction, Violation, Mine, User
from backend.app.schemas.schemas import (
    CorrectiveActionCreate, CorrectiveActionUpdate, CorrectiveActionResponse
)
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/corrective-actions", tags=["Corrective Actions"])

@router.get("", response_model=List[CorrectiveActionResponse])
def get_corrective_actions(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    overdue_only: Optional[bool] = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    query = db.query(CorrectiveAction).join(Violation).join(Mine)

    if mine_id:
        query = query.filter(CorrectiveAction.mine_id == mine_id)
    if status:
        query = query.filter(CorrectiveAction.status == status.upper())
    if priority:
        query = query.filter(CorrectiveAction.priority == priority.upper())
    if overdue_only:
        query = query.filter(
            CorrectiveAction.due_date < now,
            CorrectiveAction.status.in_(["PENDING", "IN PROGRESS", "OVERDUE"])
        )

    actions = query.order_by(desc(CorrectiveAction.created_at)).offset(skip).limit(limit).all()

    result = []
    for a in actions:
        # Auto flag overdue if past deadline and not completed
        is_overdue = (a.due_date and a.due_date.replace(tzinfo=timezone.utc) < now and a.status not in ["COMPLETED", "VERIFICATION"])
        if is_overdue and a.status != "OVERDUE":
            a.status = "OVERDUE"
            db.commit()

        result.append({
            "id": a.id,
            "action_code": a.action_code,
            "violation_id": a.violation_id,
            "violation_code": a.violation.violation_code if a.violation else None,
            "mine_id": a.mine_id,
            "mine_name": a.mine.name if a.mine else None,
            "description": a.description,
            "assigned_person": a.assigned_person,
            "priority": a.priority,
            "due_date": a.due_date,
            "completion_date": a.completion_date,
            "status": a.status,
            "evidence": a.evidence,
            "officer_notes": a.officer_notes,
            "is_overdue": is_overdue
        })
    return result

@router.post("", response_model=CorrectiveActionResponse)
def create_corrective_action(
    action_in: CorrectiveActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "INSPECTOR"]))
):
    violation = db.query(Violation).filter(Violation.id == action_in.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    act_code = f"CA-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
    new_ca = CorrectiveAction(
        action_code=act_code,
        violation_id=action_in.violation_id,
        mine_id=action_in.mine_id,
        description=action_in.description,
        assigned_person=action_in.assigned_person,
        priority=action_in.priority.upper(),
        due_date=action_in.due_date,
        status="PENDING"
    )
    db.add(new_ca)
    violation.status = "CORRECTIVE ACTION"
    db.commit()
    db.refresh(new_ca)

    log_audit_action(
        db=db,
        user=current_user,
        action="Corrective Action Created",
        entity="CorrectiveAction",
        entity_id=new_ca.id,
        details=f"Action '{act_code}' assigned to {new_ca.assigned_person}."
    )

    return {
        "id": new_ca.id,
        "action_code": new_ca.action_code,
        "violation_id": new_ca.violation_id,
        "violation_code": violation.violation_code,
        "mine_id": new_ca.mine_id,
        "mine_name": violation.mine.name if violation.mine else None,
        "description": new_ca.description,
        "assigned_person": new_ca.assigned_person,
        "priority": new_ca.priority,
        "due_date": new_ca.due_date,
        "completion_date": None,
        "status": new_ca.status,
        "evidence": None,
        "officer_notes": None,
        "is_overdue": False
    }

@router.put("/{action_id}", response_model=CorrectiveActionResponse)
def update_corrective_action(
    action_id: int,
    action_in: CorrectiveActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "MINE_MANAGER", "INSPECTOR"]))
):
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Corrective action not found")

    now = datetime.now(timezone.utc)
    if action_in.status:
        ca.status = action_in.status.upper()
        if ca.status == "COMPLETED" and not ca.completion_date:
            ca.completion_date = now
            if ca.violation:
                ca.violation.status = "RESOLVED"
    if action_in.evidence:
        ca.evidence = action_in.evidence
        if ca.status == "PENDING" or ca.status == "IN PROGRESS":
            ca.status = "SUBMITTED"
    if action_in.officer_notes:
        ca.officer_notes = action_in.officer_notes
    if action_in.completion_date:
        ca.completion_date = action_in.completion_date

    db.commit()
    db.refresh(ca)

    log_audit_action(
        db=db,
        user=current_user,
        action="Corrective Action Updated",
        entity="CorrectiveAction",
        entity_id=ca.id,
        details=f"Action '{ca.action_code}' status updated to {ca.status}."
    )

    return {
        "id": ca.id,
        "action_code": ca.action_code,
        "violation_id": ca.violation_id,
        "violation_code": ca.violation.violation_code if ca.violation else None,
        "mine_id": ca.mine_id,
        "mine_name": ca.mine.name if ca.mine else None,
        "description": ca.description,
        "assigned_person": ca.assigned_person,
        "priority": ca.priority,
        "due_date": ca.due_date,
        "completion_date": ca.completion_date,
        "status": ca.status,
        "evidence": ca.evidence,
        "officer_notes": ca.officer_notes,
        "is_overdue": False
    }
