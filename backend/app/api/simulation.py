from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import Mine
from backend.app.schemas.schemas import SimulationRunResponse
from backend.app.ai.simulation_service import run_ai_simulation_workflow

router = APIRouter(prefix="/simulation", tags=["AI Simulation Engine"])

class SimulationRequest(BaseModel):
    mine_id: Optional[int] = None

@router.post("/run", response_model=SimulationRunResponse)
def execute_simulation(
    payload: Optional[SimulationRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Executes the 14-step end-to-end AI governance simulation workflow:
    1. Baseline Telemetry Ingestion
    2. Hazard Surge Simulated
    3. Isolation Forest Anomaly Classification
    4. AI Risk Score Re-evaluation
    5. Mine Status Escalation to CRITICAL
    6. Critical Alert Broadcasted
    7. Officer Review & Acknowledgement
    8. Emergency Inspection Dispatched
    9. Digital Checklist Finding Recorded
    10. Formal Regulatory Violation Issued
    11. Mandatory Corrective Action Assigned
    12. Rectification Evidence Submitted
    13. Officer Verification & Sign-off
    14. Governance Loop Closed & Risk Normalized
    """
    target_mine_id = payload.mine_id if payload and payload.mine_id else None
    if not target_mine_id:
        first_mine = db.query(Mine).first()
        if not first_mine:
            raise HTTPException(status_code=404, detail="No mines found in database.")
        target_mine_id = first_mine.id

    result = run_ai_simulation_workflow(mine_id=target_mine_id, db=db)
    return result

@router.post("/reset")
def reset_simulation(
    mine_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Resets mine risk and status to baseline low-risk operational state"""
    target_id = mine_id or 1
    mine = db.query(Mine).filter(Mine.id == target_id).first()
    if mine:
        mine.risk_score = 24.0
        mine.risk_level = "LOW"
        mine.compliance_score = 88.0
        mine.operational_status = "Active"
        db.commit()
    return {"message": "Simulation baseline state reset successfully", "mine_id": target_id}
