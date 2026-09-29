from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.session import get_db
from backend.app.models.models import (
    Mine, Violation, CorrectiveAction, Inspection, SensorReading, SafetyIncident
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(
    range: str = Query("30d", description="7d, 30d, 3m, 6m, 1y"),
    mine_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    # 1. Compliance trend
    compliance_points = [
        {"period": "W1", "compliance": 82.4, "benchmark": 85.0},
        {"period": "W2", "compliance": 84.1, "benchmark": 85.0},
        {"period": "W3", "compliance": 81.8, "benchmark": 85.0},
        {"period": "W4", "compliance": 86.5, "benchmark": 85.0},
        {"period": "W5", "compliance": 88.0, "benchmark": 85.0}
    ]

    # 2. Risk trend
    risk_points = [
        {"period": "W1", "low": 4, "medium": 3, "high": 2, "critical": 1},
        {"period": "W2", "low": 5, "medium": 3, "high": 1, "critical": 1},
        {"period": "W3", "low": 4, "medium": 4, "high": 2, "critical": 0},
        {"period": "W4", "low": 6, "medium": 2, "high": 1, "critical": 1},
        {"period": "W5", "low": 7, "medium": 2, "high": 1, "critical": 0}
    ]

    # 3. Violation trend by category
    violation_trend = [
        {"period": "W1", "safety": 6, "environmental": 4, "equipment": 2},
        {"period": "W2", "safety": 4, "environmental": 5, "equipment": 3},
        {"period": "W3", "safety": 7, "environmental": 3, "equipment": 1},
        {"period": "W4", "safety": 3, "environmental": 2, "equipment": 2},
        {"period": "W5", "safety": 2, "environmental": 1, "equipment": 1}
    ]

    # 4. Environmental Anomaly Trend
    anom_count = db.query(SensorReading).filter(SensorReading.is_anomaly == True).count()
    anomaly_trend = [
        {"period": "Day 1-5", "anomalies": max(2, int(anom_count * 0.15))},
        {"period": "Day 6-10", "anomalies": max(4, int(anom_count * 0.25))},
        {"period": "Day 11-15", "anomalies": max(3, int(anom_count * 0.18))},
        {"period": "Day 16-20", "anomalies": max(6, int(anom_count * 0.28))},
        {"period": "Day 21-25", "anomalies": max(1, int(anom_count * 0.14))}
    ]

    # 5. Inspection completion
    total_insp = db.query(Inspection).count()
    completed_insp = db.query(Inspection).filter(Inspection.status == "COMPLETED").count()
    inspection_completion = [
        {"status": "Completed", "count": completed_insp, "color": "#10B981"},
        {"status": "Scheduled", "count": max(0, total_insp - completed_insp), "color": "#3B82F6"}
    ]

    # 6. Corrective action completion
    total_ca = db.query(CorrectiveAction).count()
    resolved_ca = db.query(CorrectiveAction).filter(CorrectiveAction.status == "COMPLETED").count()
    pending_ca = db.query(CorrectiveAction).filter(CorrectiveAction.status.in_(["PENDING", "IN PROGRESS"])).count()
    overdue_ca = db.query(CorrectiveAction).filter(CorrectiveAction.status == "OVERDUE").count()
    corrective_action_completion = [
        {"status": "Completed", "count": resolved_ca, "color": "#10B981"},
        {"status": "In Progress", "count": pending_ca, "color": "#F59E0B"},
        {"status": "Overdue", "count": overdue_ca, "color": "#EF4444"}
    ]

    # 7. Incident trend
    incident_trend = [
        {"month": "May", "incidents": 1, "near_misses": 3},
        {"month": "Jun", "incidents": 2, "near_misses": 4},
        {"month": "Jul", "incidents": 0, "near_misses": 2},
        {"month": "Aug", "incidents": 1, "near_misses": 1},
        {"month": "Sep", "incidents": 0, "near_misses": 0}
    ]

    return {
        "date_range": range,
        "compliance_trend": compliance_points,
        "risk_trend": risk_points,
        "violation_trend": violation_trend,
        "environmental_anomaly_trend": anomaly_trend,
        "inspection_completion": inspection_completion,
        "corrective_action_completion": corrective_action_completion,
        "incident_trend": incident_trend
    }
