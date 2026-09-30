import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.models import (
    Inspection, InspectionFinding, Violation, CorrectiveAction, Mine, User
)
from backend.app.schemas.schemas import (
    InspectionCreate, InspectionResponse, ChecklistSubmission, InspectionFindingResponse
)
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.get("", response_model=List[InspectionResponse])
def get_inspections(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    inspection_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection).outerjoin(Mine)

    if mine_id:
        query = query.filter(Inspection.mine_id == mine_id)
    if status:
        query = query.filter(Inspection.status == status.upper())
    if inspection_type:
        query = query.filter(Inspection.inspection_type == inspection_type)

    inspections = query.order_by(desc(Inspection.scheduled_date)).offset(skip).limit(limit).all()

    result = []
    for insp in inspections:
        findings_resp = [
            {
                "id": f.id,
                "checklist_item": f.checklist_item,
                "answer": f.answer,
                "finding_description": f.finding_description,
                "severity": f.severity,
                "evidence": f.evidence,
                "corrective_action_required": f.corrective_action_required
            }
            for f in insp.findings
        ]
        result.append({
            "id": insp.id,
            "mine_id": insp.mine_id,
            "mine_name": insp.mine.name if insp.mine else None,
            "mine": {
                "id": insp.mine.id if insp.mine else None,
                "name": insp.mine.name if insp.mine else None,
                "district": insp.mine.district if insp.mine else None,
                "state": insp.mine.state if insp.mine else None,
                "code": insp.mine.code if insp.mine else None
            } if insp.mine else None,
            "inspector_id": insp.inspector_id,
            "inspector_name": insp.inspector.name if insp.inspector else "Statutory Inspector",
            "inspector": {
                "id": insp.inspector.id if insp.inspector else None,
                "name": insp.inspector.name if insp.inspector else "Statutory Inspector"
            } if insp.inspector else None,
            "inspection_type": insp.inspection_type,
            "scheduled_date": insp.scheduled_date,
            "completed_date": insp.completed_date,
            "status": insp.status,
            "overall_finding": insp.overall_finding,
            "recommendations": insp.recommendations,
            "findings": findings_resp
        })
    return result

@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection_by_id(inspection_id: int, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    findings_resp = [
        {
            "id": f.id,
            "checklist_item": f.checklist_item,
            "answer": f.answer,
            "finding_description": f.finding_description,
            "severity": f.severity,
            "evidence": f.evidence,
            "corrective_action_required": f.corrective_action_required
        }
        for f in insp.findings
    ]

    return {
        "id": insp.id,
        "mine_id": insp.mine_id,
        "mine_name": insp.mine.name if insp.mine else None,
        "mine": {
            "id": insp.mine.id if insp.mine else None,
            "name": insp.mine.name if insp.mine else None,
            "district": insp.mine.district if insp.mine else None,
            "state": insp.mine.state if insp.mine else None,
            "code": insp.mine.code if insp.mine else None
        } if insp.mine else None,
        "inspector_id": insp.inspector_id,
        "inspector_name": insp.inspector.name if insp.inspector else "Statutory Inspector",
        "inspector": {
            "id": insp.inspector.id if insp.inspector else None,
            "name": insp.inspector.name if insp.inspector else "Statutory Inspector"
        } if insp.inspector else None,
        "inspection_type": insp.inspection_type,
        "scheduled_date": insp.scheduled_date,
        "completed_date": insp.completed_date,
        "status": insp.status,
        "overall_finding": insp.overall_finding,
        "recommendations": insp.recommendations,
        "findings": findings_resp
    }

@router.post("", response_model=InspectionResponse)
def schedule_inspection(
    insp_in: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "INSPECTOR"]))
):
    mine = db.query(Mine).filter(Mine.id == insp_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    new_insp = Inspection(
        mine_id=insp_in.mine_id,
        inspector_id=insp_in.inspector_id or current_user.id,
        inspection_type=insp_in.inspection_type,
        scheduled_date=insp_in.scheduled_date,
        status="SCHEDULED",
        overall_finding=insp_in.overall_finding,
        recommendations=insp_in.recommendations
    )
    db.add(new_insp)
    mine.next_inspection = insp_in.scheduled_date
    db.commit()
    db.refresh(new_insp)

    log_audit_action(
        db=db,
        user=current_user,
        action="Inspection Scheduled",
        entity="Inspection",
        entity_id=new_insp.id,
        details=f"Scheduled {new_insp.inspection_type} inspection for {mine.name}."
    )

    return get_inspection_by_id(new_insp.id, db)

@router.post("/{inspection_id}/checklist", response_model=InspectionResponse)
def submit_inspection_checklist(
    inspection_id: int,
    submission: ChecklistSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "INSPECTOR"]))
):
    """
    Submits digital inspection checklist answers.
    Automatically generates violation and corrective action if any critical item fails (answer == 'NO').
    """
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    now = datetime.now(timezone.utc)
    insp.status = submission.status.upper()
    insp.completed_date = now
    if submission.overall_finding:
        insp.overall_finding = submission.overall_finding
    if submission.recommendations:
        insp.recommendations = submission.recommendations

    mine = insp.mine
    if mine:
        mine.last_inspection = now

    failed_items_count = 0
    for item in submission.items:
        finding = InspectionFinding(
            inspection_id=insp.id,
            checklist_item=item.checklist_item,
            answer=item.answer.upper(),
            finding_description=item.finding_description,
            severity=item.severity.upper() if item.severity else "LOW",
            evidence=item.evidence,
            corrective_action_required=item.corrective_action_required or (item.answer.upper() == "NO")
        )
        db.add(finding)

        # If answer is NO, automatically create formal Violation & Corrective Action
        if item.answer.upper() == "NO":
            failed_items_count += 1
            viol_code = f"VIO-{mine.code.split('-')[1] if mine else 'MIN'}-{uuid.uuid4().hex[:4].upper()}"
            viol = Violation(
                violation_code=viol_code,
                mine_id=insp.mine_id,
                inspection_id=insp.id,
                category="Safety" if "safety" in item.checklist_item.lower() or "ventilation" in item.checklist_item.lower() else "Operational compliance",
                description=f"Inspection non-compliance: {item.checklist_item}. {item.finding_description or 'Remediation required.'}",
                severity=item.severity.upper() if item.severity else "HIGH",
                detected_by=current_user.name,
                status="CORRECTIVE ACTION",
                due_date=now + timedelta(days=7),
                assigned_officer="Er. Rajesh Kumar"
            )
            db.add(viol)
            db.commit()
            db.refresh(viol)

            # Auto create corrective action
            ca_code = f"CA-{now.year}-{uuid.uuid4().hex[:4].upper()}"
            ca = CorrectiveAction(
                action_code=ca_code,
                violation_id=viol.id,
                mine_id=insp.mine_id,
                description=f"Rectify deficiency identified in inspection #{insp.id}: {item.checklist_item}.",
                assigned_person="Mine Safety Engineer",
                priority=viol.severity,
                due_date=now + timedelta(days=7),
                status="PENDING"
            )
            db.add(ca)

    db.commit()

    log_audit_action(
        db=db,
        user=current_user,
        action="Inspection Completed",
        entity="Inspection",
        entity_id=insp.id,
        details=f"Inspection #{insp.id} checklist submitted by {current_user.name} ({failed_items_count} non-conformances)."
    )

    return get_inspection_by_id(insp.id, db)
