from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import ComplianceRecord, ComplianceRule, Mine, User
from backend.app.schemas.schemas import (
    ComplianceRecordResponse, ComplianceRecordUpdate, ComplianceRuleResponse
)
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/compliance", tags=["Compliance"])

@router.get("/rules", response_model=List[ComplianceRuleResponse])
def get_compliance_rules(db: Session = Depends(get_db)):
    rules = db.query(ComplianceRule).all()
    return rules

@router.api_route("/init-seed", methods=["GET", "POST"])
def trigger_seed_database(db: Session = Depends(get_db)):
    """
    Idempotent database seeding endpoint for production initialization.
    Ensures all 10 demo mines, 50 compliance records, 30 violations, 25 inspections,
    30 corrective actions, 50 alerts, and 1000 sensor readings exist.
    """
    from backend.app.services.seed_service import seed_database_if_empty, ensure_schema_migrations
    ensure_schema_migrations(db.get_bind())
    summary = seed_database_if_empty(db)
    return {
        "status": "success",
        "message": "Database synchronized and seeded idempotently.",
        "counts": summary
    }

@router.get("", response_model=List[ComplianceRecordResponse])
def get_compliance_records(
    mine_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db)
):
    query = db.query(ComplianceRecord).outerjoin(ComplianceRule).outerjoin(Mine)

    if mine_id:
        query = query.filter(ComplianceRecord.mine_id == mine_id)
    if category:
        query = query.filter(ComplianceRule.category == category)
    if status:
        query = query.filter(ComplianceRecord.status == status.upper())

    records = query.order_by(ComplianceRecord.updated_at.desc()).offset(skip).limit(limit).all()

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "mine_id": r.mine_id,
            "mine_name": r.mine.name if r.mine else None,
            "mine": {
                "id": r.mine.id if r.mine else None,
                "name": r.mine.name if r.mine else None,
                "code": r.mine.code if r.mine else None
            } if r.mine else None,
            "rule_id": r.rule_id,
            "rule_code": r.rule.rule_code if r.rule else None,
            "rule_name": r.rule.rule_name if r.rule else None,
            "category": r.rule.category if r.rule else None,
            "rule": {
                "id": r.rule.id if r.rule else None,
                "rule_code": r.rule.rule_code if r.rule else None,
                "rule_name": r.rule.rule_name if r.rule else None,
                "category": r.rule.category if r.rule else None,
                "description": r.rule.description if r.rule else None,
                "penalty_points": r.rule.penalty_points if r.rule else 10,
                "mandatory": r.rule.mandatory if r.rule else True
            } if r.rule else None,
            "status": r.status,
            "score": r.score,
            "due_date": r.due_date,
            "last_verified": r.last_verified,
            "evidence": r.evidence,
            "remarks": r.remarks
        })
    return result

@router.put("/{record_id}", response_model=ComplianceRecordResponse)
def update_compliance_record(
    record_id: int,
    update_in: ComplianceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "MINE_MANAGER", "INSPECTOR"]))
):
    record = db.query(ComplianceRecord).filter(ComplianceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Compliance record not found")

    if update_in.status:
        record.status = update_in.status.upper()
    if update_in.score is not None:
        record.score = update_in.score
    if update_in.evidence:
        record.evidence = update_in.evidence
    if update_in.remarks:
        record.remarks = update_in.remarks

    record.last_verified = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    log_audit_action(
        db=db,
        user=current_user,
        action="Compliance Updated",
        entity="Compliance",
        entity_id=record.id,
        details=f"Compliance status updated to '{record.status}' for Mine {record.mine.name if record.mine else record.mine_id}."
    )

    return {
        "id": record.id,
        "mine_id": record.mine_id,
        "mine_name": record.mine.name if record.mine else None,
        "rule_id": record.rule_id,
        "rule_code": record.rule.rule_code if record.rule else None,
        "rule_name": record.rule.rule_name if record.rule else None,
        "category": record.rule.category if record.rule else None,
        "status": record.status,
        "score": record.score,
        "due_date": record.due_date,
        "last_verified": record.last_verified,
        "evidence": record.evidence,
        "remarks": record.remarks
    }
