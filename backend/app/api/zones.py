from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import MineLocation, Mine, Worker, Hazard, SensorReading

router = APIRouter(prefix="/zones", tags=["Underground Mine Zones"])

@router.get("")
def get_mine_zones(
    mine_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MineLocation).outerjoin(Mine)
    if mine_id:
        query = query.filter(MineLocation.mine_id == mine_id)

    locations = query.all()
    result = []
    for loc in locations:
        workers_count = db.query(Worker).filter(
            Worker.mine_id == loc.mine_id,
            Worker.assigned_zone == loc.zone_name
        ).count()
        hazards_count = db.query(Hazard).filter(
            Hazard.mine_id == loc.mine_id,
            Hazard.zone_name == loc.zone_name,
            Hazard.status == "ACTIVE"
        ).count()

        result.append({
            "id": loc.id,
            "mine_id": loc.mine_id,
            "mine_name": loc.mine.name if loc.mine else "Colliery",
            "zone_name": loc.zone_name,
            "coordinates": loc.coordinates,
            "hazard_level": loc.hazard_level,
            "workers_present": workers_count,
            "active_hazards": hazards_count,
            "status": "ELEVATED_RISK" if hazards_count > 0 else "NORMAL"
        })
    return result
