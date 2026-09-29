from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Mine, SensorReading, Violation, ComplianceRecord
from backend.app.services.groq_service import groq_service
from backend.app.ai.risk_engine import evaluate_mine_risk

router = APIRouter(prefix="/ai", tags=["AI & Groq Intelligence"])

class CopilotQuery(BaseModel):
    query: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    mine_id: Optional[int] = None

@router.get("/status")
def get_ai_status():
    """Returns status of Groq LLM and local ML anomaly engines."""
    return {
        "engine": "CoalGuard AI Hybrid Intelligence",
        "groq": groq_service.get_status(),
        "anomaly_detector": {
            "type": "Scikit-Learn IsolationForest",
            "status": "online",
            "features": 8,
            "target": "Multi-Gas Atmospheric Telemetry"
        }
    }

@router.post("/copilot")
def ask_ai_copilot(payload: CopilotQuery, db: Session = Depends(get_db)):
    """
    Conversational AI Mining Governance Assistant powered by Groq LLM on backend.
    """
    context = None
    if payload.mine_id:
        mine = db.query(Mine).filter(Mine.id == payload.mine_id).first()
        if mine:
            context = (
                f"Active Mine: {mine.name} ({mine.code})\n"
                f"Location: {mine.district}, {mine.state}\n"
                f"Type: {mine.mine_type} | Capacity: {mine.production_capacity} MTPA\n"
                f"Risk Score: {mine.risk_score} ({mine.risk_level})\n"
                f"Compliance Score: {mine.compliance_score}%\n"
            )

    result = groq_service.ask_assistant(
        query=payload.query,
        conversation_history=payload.conversation_history,
        context=context
    )
    return result

@router.post("/mine-analysis/{mine_id}")
def generate_deep_mine_analysis(mine_id: int, db: Session = Depends(get_db)):
    """
    Generates an executive-grade AI safety & compliance analysis for a specific mine using Groq.
    """
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine record not found")

    risk_eval = evaluate_mine_risk(mine.id, db)

    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.mine_id == mine.id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    sensors_dict = None
    if latest_reading:
        sensors_dict = {
            "methane": f"{latest_reading.methane}%",
            "co": f"{latest_reading.co} ppm",
            "dust": f"{latest_reading.dust} ug/m3",
            "temperature": f"{latest_reading.temperature} C",
            "flag": latest_reading.risk_flag
        }

    groq_synthesis = groq_service.generate_risk_insight(
        mine_name=mine.name,
        risk_score=risk_eval["risk_score"],
        risk_level=risk_eval["risk_level"],
        factors=risk_eval["factors"],
        recent_sensors=sensors_dict
    )

    return {
        "mine_id": mine.id,
        "mine_name": mine.name,
        "risk_evaluation": risk_eval,
        "groq_analysis": groq_synthesis
    }
