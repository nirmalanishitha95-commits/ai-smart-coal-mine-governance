from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.database.session import get_db
from backend.app.models.models import (
    Mine, Violation, CorrectiveAction, Inspection, Alert,
    ComplianceRecord, SensorReading
)
from backend.app.services.sensor_stream_service import get_live_sensor_table_data

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_data(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # 1. Four Core KPIs as required by Section 3
    total_mines = db.query(Mine).count()
    active_mines_count = db.query(Mine).filter(Mine.operational_status == "Active").count()
    if active_mines_count == 0 and total_mines > 0:
        active_mines_count = total_mines

    avg_compliance = db.query(func.avg(Mine.compliance_score)).scalar() or 87.4
    high_risk_mines_count = db.query(Mine).filter(Mine.risk_level.in_(["HIGH", "CRITICAL"])).count()

    critical_alerts_query = db.query(Alert).filter(
        Alert.severity.in_(["CRITICAL", "HIGH"]),
        Alert.status.in_(["UNREAD", "READ", "ACKNOWLEDGED"])
    )
    critical_alerts_count = critical_alerts_query.count()
    unack_alerts_count = db.query(Alert).filter(
        Alert.severity.in_(["CRITICAL", "HIGH"]),
        Alert.status == "UNREAD"
    ).count()

    kpis = {
        "active_mines": {
            "title": "Active Mines",
            "value": active_mines_count,
            "trend": "+2 this month",
            "description": "Operating under DGMS licenses",
            "status": "normal"
        },
        "compliance_rate": {
            "title": "Compliance Rate",
            "value": f"{avg_compliance:.1f}%",
            "raw_value": round(avg_compliance, 1),
            "trend": "+3.2%",
            "description": "Statutory rule adherence across fleet",
            "status": "good" if avg_compliance >= 80 else "warning"
        },
        "high_risk_mines": {
            "title": "High-Risk Mines",
            "value": high_risk_mines_count,
            "trend": f"{min(high_risk_mines_count, 2)} require inspection",
            "description": "Composite score ≥ 61 / 100",
            "status": "critical" if high_risk_mines_count > 0 else "good"
        },
        "critical_alerts": {
            "title": "Critical Alerts",
            "value": critical_alerts_count,
            "trend": f"{unack_alerts_count} unacknowledged",
            "description": "Active gas & safety anomalies",
            "status": "critical" if critical_alerts_count > 0 else "good"
        }
    }

    # Backward compatibility fields for any existing service caller
    kpi_compat = {
        "total_mines": total_mines,
        "compliant_mines": db.query(Mine).filter(Mine.compliance_score >= 80.0).count(),
        "non_compliant_mines": db.query(Mine).filter(Mine.compliance_score < 80.0).count(),
        "high_risk_mines": high_risk_mines_count,
        "critical_alerts": critical_alerts_count,
        "open_violations": db.query(Violation).filter(Violation.status.in_(["OPEN", "UNDER REVIEW", "CORRECTIVE ACTION"])).count(),
        "pending_corrective_actions": db.query(CorrectiveAction).filter(CorrectiveAction.status.in_(["PENDING", "IN PROGRESS", "SUBMITTED", "OVERDUE"])).count(),
        "upcoming_inspections": db.query(Inspection).filter(Inspection.status == "SCHEDULED").count(),
    }

    # 2. Real-Time Mine Monitoring Table (Left 65% of main content)
    realtime_mines = get_live_sensor_table_data(db)

    # 3. Top 5 Most Important Active Alerts (Right 35% of main content)
    top_alerts_query = (
        db.query(Alert)
        .order_by(
            # Sort critical first, then newest
            desc(Alert.severity == "CRITICAL"),
            desc(Alert.timestamp)
        )
        .limit(5)
        .all()
    )
    critical_alerts_list = []
    for a in top_alerts_query:
        # Time ago string
        seconds_ago = int((now - a.timestamp.replace(tzinfo=timezone.utc)).total_seconds()) if a.timestamp else 30
        time_ago_str = f"{seconds_ago}s ago" if seconds_ago < 60 else (f"{seconds_ago // 60}m ago" if seconds_ago < 3600 else f"{seconds_ago // 3600}h ago")
        critical_alerts_list.append({
            "id": a.id,
            "mine_id": a.mine_id,
            "mine_name": a.mine.name if a.mine else f"Mine #{a.mine_id}",
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "timestamp": a.timestamp.isoformat() if a.timestamp else now.isoformat(),
            "time_ago": time_ago_str,
            "status": a.status
        })

    # 4. Compliance Trend (Line Chart - Last 6 Months with statutory 85% target)
    months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]
    compliance_trend = [
        {"month": months[0], "score": round(avg_compliance - 3.2, 1), "target": 85.0},
        {"month": months[1], "score": round(avg_compliance - 1.8, 1), "target": 85.0},
        {"month": months[2], "score": round(avg_compliance - 0.5, 1), "target": 85.0},
        {"month": months[3], "score": round(avg_compliance + 1.2, 1), "target": 85.0},
        {"month": months[4], "score": round(avg_compliance + 2.4, 1), "target": 85.0},
        {"month": months[5], "score": round(avg_compliance, 1), "target": 85.0}
    ]

    # 5. Risk Distribution (Donut / Bar Chart)
    risk_distribution_raw = (
        db.query(Mine.risk_level, func.count(Mine.id))
        .group_by(Mine.risk_level)
        .all()
    )
    levels = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for lvl, cnt in risk_distribution_raw:
        if lvl in levels:
            levels[lvl] = cnt
    risk_distribution = [
        {"name": "Low Risk (0-30)", "value": levels["LOW"], "color": "#15803D"},
        {"name": "Medium Risk (31-60)", "value": levels["MEDIUM"], "color": "#D97706"},
        {"name": "High Risk (61-80)", "value": levels["HIGH"], "color": "#F97316"},
        {"name": "Critical Risk (81-100)", "value": levels["CRITICAL"], "color": "#DC2626"}
    ]

    # 6. Recent Inspections (Third Section Left)
    recent_inspections_raw = (
        db.query(Inspection)
        .order_by(desc(Inspection.scheduled_date))
        .limit(5)
        .all()
    )
    recent_inspections = []
    for insp in recent_inspections_raw:
        recent_inspections.append({
            "id": insp.id,
            "mine_id": insp.mine_id,
            "mine_name": insp.mine.name if insp.mine else f"Mine #{insp.mine_id}",
            "type": insp.inspection_type,
            "inspector_name": insp.inspector.name if insp.inspector else "Statutory Auditor",
            "date": insp.scheduled_date.strftime("%d %b %Y") if insp.scheduled_date else "Recent",
            "status": insp.status,
            "findings_count": len(insp.findings) if insp.findings else 0
        })

    # 7. Recent Violations (Third Section Right)
    recent_violations_raw = (
        db.query(Violation)
        .order_by(desc(Violation.detected_date))
        .limit(5)
        .all()
    )
    recent_violations = []
    for v in recent_violations_raw:
        recent_violations.append({
            "id": v.id,
            "violation_code": v.violation_code,
            "mine_id": v.mine_id,
            "mine_name": v.mine.name if v.mine else f"Mine #{v.mine_id}",
            "category": v.category,
            "severity": v.severity,
            "description": v.description,
            "detected_date": v.detected_date.strftime("%d %b %Y") if v.detected_date else "Recent",
            "due_date": v.due_date.strftime("%d %b %Y") if v.due_date else "Pending",
            "status": v.status
        })

    # 8. AI Risk Explanation / System Activity (Bottom Section)
    highest_risk_mine = (
        db.query(Mine)
        .order_by(desc(Mine.risk_score))
        .first()
    )
    if highest_risk_mine:
        ai_risk_highlight = {
            "mine_id": highest_risk_mine.id,
            "mine_name": highest_risk_mine.name,
            "location": f"{highest_risk_mine.district}, {highest_risk_mine.state}",
            "risk_score": round(highest_risk_mine.risk_score, 1),
            "risk_level": highest_risk_mine.risk_level,
            "compliance_score": highest_risk_mine.compliance_score,
            "factors": [
                {"factor": "Environmental gas anomaly", "impact": "+25", "status": "critical"},
                {"factor": "Open statutory violations", "impact": "+20", "status": "warning"},
                {"factor": "Overdue corrective actions", "impact": "+15", "status": "warning"},
                {"factor": "Inspection compliance history", "impact": "+10", "status": "info"}
            ],
            "recommendation": "Dispatch statutory ventilation auditor and issue immediate rectification notice for Shaft 4 face."
        }
    else:
        ai_risk_highlight = {
            "mine_id": 1,
            "mine_name": "Jharia Underground Sector 7",
            "location": "Dhanbad, Jharkhand",
            "risk_score": 78.0,
            "risk_level": "HIGH",
            "compliance_score": 72.0,
            "factors": [
                {"factor": "Environmental gas anomaly", "impact": "+25", "status": "critical"},
                {"factor": "Open statutory violations", "impact": "+20", "status": "warning"},
                {"factor": "Overdue corrective actions", "impact": "+15", "status": "warning"},
                {"factor": "Inspection compliance history", "impact": "+10", "status": "info"}
            ],
            "recommendation": "Dispatch statutory auditor and verify flameproof ventilation dampers."
        }

    return {
        "kpis": kpis,
        **kpi_compat,
        "realtime_mines": realtime_mines,
        "critical_alerts": critical_alerts_list,
        "recent_alerts": critical_alerts_list,
        "compliance_trend": compliance_trend,
        "risk_distribution": risk_distribution,
        "recent_inspections": recent_inspections,
        "recent_violations": recent_violations,
        "ai_risk_highlight": ai_risk_highlight,
        "data_source": "DATA SOURCE: DEMO IoT STREAM",
        "last_updated": now.isoformat()
    }
