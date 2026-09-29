from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from backend.app.database.session import get_db
from backend.app.models.models import Mine, Violation, Alert, User
from backend.app.schemas.schemas import (
    MineCreate, MineUpdate, MineResponse, MineRiskResponse
)
from backend.app.ai.risk_engine import evaluate_mine_risk
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/mines", tags=["Mines"])

@router.get("", response_model=List[MineResponse])
def get_mines(
    search: Optional[str] = Query(None, description="Search by name, code, district, or state"),
    risk_level: Optional[str] = Query(None, description="Filter by LOW, MEDIUM, HIGH, CRITICAL"),
    mine_type: Optional[str] = Query(None, description="Opencast, Underground, Mixed"),
    operational_status: Optional[str] = Query(None, description="Active, Under Review, etc."),
    sort_by: Optional[str] = Query("risk_score", description="risk_score, compliance_score, name"),
    order: Optional[str] = Query("desc", description="asc or desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Mine)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Mine.name.ilike(search_fmt),
                Mine.code.ilike(search_fmt),
                Mine.district.ilike(search_fmt),
                Mine.state.ilike(search_fmt)
            )
        )

    if risk_level:
        query = query.filter(Mine.risk_level == risk_level.upper())
    if mine_type:
        query = query.filter(Mine.mine_type == mine_type)
    if operational_status:
        query = query.filter(Mine.operational_status == operational_status)

    # Sorting
    sort_col = getattr(Mine, sort_by, Mine.risk_score)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    mines = query.offset(skip).limit(limit).all()

    # Enrich with counts
    result = []
    for m in mines:
        open_viols = db.query(Violation).filter(
            Violation.mine_id == m.id,
            Violation.status.in_(["OPEN", "UNDER REVIEW", "CORRECTIVE ACTION"])
        ).count()
        active_alerts = db.query(Alert).filter(
            Alert.mine_id == m.id,
            Alert.status.in_(["UNREAD", "READ", "ACKNOWLEDGED"])
        ).count()

        m_dict = {
            "id": m.id,
            "name": m.name,
            "code": m.code,
            "location": m.location,
            "district": m.district,
            "state": m.state,
            "mine_type": m.mine_type,
            "production_capacity": m.production_capacity,
            "operational_status": m.operational_status,
            "compliance_score": m.compliance_score,
            "risk_score": m.risk_score,
            "risk_level": m.risk_level,
            "last_inspection": m.last_inspection,
            "next_inspection": m.next_inspection,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "open_violations_count": open_viols,
            "active_alerts_count": active_alerts
        }
        result.append(m_dict)

    return result

@router.get("/{mine_id}", response_model=MineResponse)
def get_mine_by_id(mine_id: int, db: Session = Depends(get_db)):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    open_viols = db.query(Violation).filter(
        Violation.mine_id == mine.id,
        Violation.status.in_(["OPEN", "UNDER REVIEW", "CORRECTIVE ACTION"])
    ).count()
    active_alerts = db.query(Alert).filter(
        Alert.mine_id == mine.id,
        Alert.status.in_(["UNREAD", "READ", "ACKNOWLEDGED"])
    ).count()

    return {
        "id": mine.id,
        "name": mine.name,
        "code": mine.code,
        "location": mine.location,
        "district": mine.district,
        "state": mine.state,
        "mine_type": mine.mine_type,
        "production_capacity": mine.production_capacity,
        "operational_status": mine.operational_status,
        "compliance_score": mine.compliance_score,
        "risk_score": mine.risk_score,
        "risk_level": mine.risk_level,
        "last_inspection": mine.last_inspection,
        "next_inspection": mine.next_inspection,
        "latitude": mine.latitude,
        "longitude": mine.longitude,
        "open_violations_count": open_viols,
        "active_alerts_count": active_alerts
    }

@router.get("/{mine_id}/risk", response_model=MineRiskResponse)
def get_mine_risk_assessment(mine_id: int, db: Session = Depends(get_db)):
    """AI-Assisted Explainable Risk Evaluation for Mine"""
    risk_data = evaluate_mine_risk(mine_id=mine_id, db=db)
    return risk_data

@router.post("", response_model=MineResponse)
def create_mine(
    mine_in: MineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER"]))
):
    existing = db.query(Mine).filter(
        or_(Mine.name == mine_in.name, Mine.code == mine_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mine with this name or code already exists")

    new_mine = Mine(
        name=mine_in.name,
        code=mine_in.code,
        location=mine_in.location,
        district=mine_in.district,
        state=mine_in.state,
        mine_type=mine_in.mine_type,
        production_capacity=mine_in.production_capacity,
        operational_status=mine_in.operational_status,
        latitude=mine_in.latitude,
        longitude=mine_in.longitude,
        compliance_score=85.0,
        risk_score=25.0,
        risk_level="LOW"
    )
    db.add(new_mine)
    db.commit()
    db.refresh(new_mine)

    log_audit_action(
        db=db,
        user=current_user,
        action="Mine Created",
        entity="Mine",
        entity_id=new_mine.id,
        details=f"Mine '{new_mine.name}' created by {current_user.email}."
    )

    return get_mine_by_id(new_mine.id, db)

@router.put("/{mine_id}", response_model=MineResponse)
def update_mine(
    mine_id: int,
    mine_in: MineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_OFFICER", "MINE_MANAGER"]))
):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    update_data = mine_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(mine, field, val)

    db.commit()
    db.refresh(mine)

    log_audit_action(
        db=db,
        user=current_user,
        action="Mine Updated",
        entity="Mine",
        entity_id=mine.id,
        details=f"Mine '{mine.name}' updated by {current_user.email}."
    )

    return get_mine_by_id(mine.id, db)

@router.delete("/{mine_id}")
def delete_mine(
    mine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["SUPER_ADMIN"]))
):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    db.delete(mine)
    db.commit()

    log_audit_action(
        db=db,
        user=current_user,
        action="Mine Deleted",
        entity="Mine",
        entity_id=mine_id,
        details=f"Mine ID {mine_id} deleted by {current_user.email}."
    )

    return {"message": "Mine successfully deleted", "mine_id": mine_id}
