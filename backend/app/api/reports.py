import io
import csv
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import (
    Mine, ComplianceRecord, Violation, Inspection, CorrectiveAction, SensorReading
)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_report_data(
    report_type: str = Query("compliance", description="compliance, risk, violation, inspection, environmental, corrective_action"),
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    if report_type == "compliance":
        query = db.query(ComplianceRecord).join(Mine)
        if mine_id:
            query = query.filter(ComplianceRecord.mine_id == mine_id)
        if status:
            query = query.filter(ComplianceRecord.status == status.upper())
        records = query.limit(100).all()
        data = [
            {
                "id": r.id,
                "mine": r.mine.name if r.mine else "N/A",
                "rule": r.rule.rule_name if r.rule else "N/A",
                "category": r.rule.category if r.rule else "N/A",
                "status": r.status,
                "score": r.score,
                "last_verified": r.last_verified.strftime("%Y-%m-%d") if r.last_verified else "N/A"
            }
            for r in records
        ]
        columns = ["Mine", "Rule", "Category", "Status", "Score", "Last Verified"]

    elif report_type == "risk":
        query = db.query(Mine)
        if mine_id:
            query = query.filter(Mine.id == mine_id)
        if status:
            query = query.filter(Mine.risk_level == status.upper())
        mines = query.all()
        data = [
            {
                "id": m.id,
                "mine": m.name,
                "state": m.state,
                "type": m.mine_type,
                "risk_score": m.risk_score,
                "risk_level": m.risk_level,
                "compliance_score": m.compliance_score,
                "operational_status": m.operational_status
            }
            for m in mines
        ]
        columns = ["Mine", "State", "Type", "Risk Score", "Risk Level", "Compliance Score", "Status"]

    elif report_type == "violation":
        query = db.query(Violation).join(Mine)
        if mine_id:
            query = query.filter(Violation.mine_id == mine_id)
        if status:
            query = query.filter(Violation.status == status.upper())
        viols = query.limit(100).all()
        data = [
            {
                "id": v.id,
                "code": v.violation_code,
                "mine": v.mine.name if v.mine else "N/A",
                "category": v.category,
                "severity": v.severity,
                "status": v.status,
                "fine": f"₹{v.fine_amount:,.0f}",
                "detected_date": v.detected_date.strftime("%Y-%m-%d") if v.detected_date else "N/A"
            }
            for v in viols
        ]
        columns = ["Code", "Mine", "Category", "Severity", "Status", "Fine", "Detected Date"]

    elif report_type == "inspection":
        query = db.query(Inspection).join(Mine)
        if mine_id:
            query = query.filter(Inspection.mine_id == mine_id)
        if status:
            query = query.filter(Inspection.status == status.upper())
        insps = query.limit(100).all()
        data = [
            {
                "id": i.id,
                "mine": i.mine.name if i.mine else "N/A",
                "type": i.inspection_type,
                "status": i.status,
                "scheduled": i.scheduled_date.strftime("%Y-%m-%d") if i.scheduled_date else "N/A",
                "finding": i.overall_finding or "Routine satisfactory"
            }
            for i in insps
        ]
        columns = ["Mine", "Type", "Status", "Scheduled Date", "Finding Summary"]

    else: # corrective_action
        query = db.query(CorrectiveAction).join(Mine)
        if mine_id:
            query = query.filter(CorrectiveAction.mine_id == mine_id)
        if status:
            query = query.filter(CorrectiveAction.status == status.upper())
        actions = query.limit(100).all()
        data = [
            {
                "id": a.id,
                "code": a.action_code or f"CA-{a.id}",
                "mine": a.mine.name if a.mine else "N/A",
                "assigned_to": a.assigned_person,
                "priority": a.priority,
                "status": a.status,
                "due_date": a.due_date.strftime("%Y-%m-%d") if a.due_date else "N/A"
            }
            for a in actions
        ]
        columns = ["Action Code", "Mine", "Assigned To", "Priority", "Status", "Due Date"]

    return {
        "report_type": report_type,
        "generated_at": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "total_records": len(data),
        "columns": columns,
        "rows": data
    }

@router.get("/export-csv")
def export_csv(
    report_type: str = Query("compliance"),
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    report_res = get_report_data(report_type=report_type, mine_id=mine_id, status=status, db=db)
    rows = report_res["rows"]

    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    else:
        output.write("No records found for current filters.")

    csv_data = output.getvalue()
    filename = f"coalguard_{report_type}_report_{datetime.now().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
