from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Worker, Mine

router = APIRouter(prefix="/workers", tags=["Underground Worker Safety"])

class WorkerStatusUpdate(BaseModel):
    status: str
    assigned_zone: Optional[str] = None

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
    if status:
        query = query.filter(Worker.status == status.upper())
    if zone:
        query = query.filter(Worker.assigned_zone == zone)

    workers = query.all()
    return [
        {
            "id": w.id,
            "worker_code": w.worker_code,
            "name": w.name,
            "mine_id": w.mine_id,
            "mine_name": w.mine.name if w.mine else "Colliery",
            "role": w.role,
            "assigned_zone": w.assigned_zone,
            "shift": w.shift,
            "status": w.status,
            "heart_rate": w.heart_rate,
            "body_temperature": w.body_temperature,
            "battery_level": w.battery_level,
            "last_beacon": w.last_beacon.isoformat() if w.last_beacon else None,
            "location_mode": w.location_mode or "DEMO WORKER LOCATION"
        }
        for w in workers
    ]

@router.get("/summary")
def get_worker_safety_summary(db: Session = Depends(get_db)):
    total = db.query(Worker).count()
    safe = db.query(Worker).filter(Worker.status == "SAFE").count()
    in_hazard = db.query(Worker).filter(Worker.status == "IN_HAZARD_ZONE").count()
    evacuating = db.query(Worker).filter(Worker.status == "EVACUATING").count()
    unaccounted = db.query(Worker).filter(Worker.status == "UNACCOUNTED").count()

    return {
        "total_monitored": total,
        "safe_count": safe,
        "in_hazard_zone": in_hazard,
        "evacuating_count": evacuating,
        "unaccounted_count": unaccounted,
        "location_mode": "DEMO WORKER LOCATION",
        "notice": "Simulated positioning telemetry under DEMO WORKER LOCATION mode."
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

    worker.status = payload.status.upper()
    if payload.assigned_zone:
        worker.assigned_zone = payload.assigned_zone
    worker.last_beacon = datetime.now(timezone.utc)
    db.commit()

    return {"status": "success", "worker_code": worker.worker_code, "new_status": worker.status}
