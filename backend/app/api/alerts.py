from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.models import Alert, Mine, User
from backend.app.schemas.schemas import AlertResponse
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    mine_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).outerjoin(Mine)

    if mine_id:
        query = query.filter(Alert.mine_id == mine_id)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if status:
        query = query.filter(Alert.status == status.upper())

    alerts = query.order_by(desc(Alert.timestamp)).offset(skip).limit(limit).all()

    result = []
    for a in alerts:
        result.append({
            "id": a.id,
            "mine_id": a.mine_id,
            "mine_name": a.mine.name if a.mine else None,
            "mine": {
                "id": a.mine.id if a.mine else None,
                "name": a.mine.name if a.mine else None,
                "code": a.mine.code if a.mine else None
            } if a.mine else None,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "timestamp": a.timestamp,
            "status": a.status,
            "acknowledged_by": a.acknowledged_by
        })
    return result

@router.get("/unread-count")
def get_unread_alerts_count(db: Session = Depends(get_db)):
    count = db.query(Alert).filter(Alert.status.in_(["UNREAD", "READ"])).count()
    critical_count = db.query(Alert).filter(
        Alert.severity == "CRITICAL",
        Alert.status.in_(["UNREAD", "READ"])
    ).count()
    return {"unread_count": count, "critical_count": critical_count}

@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "MINE_MANAGER", "INSPECTOR"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = current_user.name
    db.commit()
    db.refresh(alert)

    log_audit_action(
        db=db,
        user=current_user,
        action="Alert Acknowledged",
        entity="Alert",
        entity_id=alert.id,
        details=f"Alert #{alert.id} ({alert.alert_type}) acknowledged by {current_user.name}."
    )

    return {
        "id": alert.id,
        "mine_id": alert.mine_id,
        "mine_name": alert.mine.name if alert.mine else None,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "message": alert.message,
        "timestamp": alert.timestamp,
        "status": alert.status,
        "acknowledged_by": alert.acknowledged_by
    }

@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "MINE_MANAGER"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    db.commit()
    db.refresh(alert)

    log_audit_action(
        db=db,
        user=current_user,
        action="Alert Resolved",
        entity="Alert",
        entity_id=alert.id,
        details=f"Alert #{alert.id} resolved."
    )

    return {
        "id": alert.id,
        "mine_id": alert.mine_id,
        "mine_name": alert.mine.name if alert.mine else None,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "message": alert.message,
        "timestamp": alert.timestamp,
        "status": alert.status,
        "acknowledged_by": alert.acknowledged_by
    }
