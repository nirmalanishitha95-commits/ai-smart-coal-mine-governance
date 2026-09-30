import io
import csv
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.models import (
    Mine, ComplianceRecord, ComplianceRule, Violation, Inspection,
    CorrectiveAction, EnvironmentalReading, SensorReading, Alert, User, AuditLog
)
from backend.app.services.auth_service import get_current_user_optional
from backend.app.services.pdf_report_service import build_pdf_dossier
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/reports", tags=["Reports"])


def parse_date_param(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    val = val.strip()
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    return None


def apply_role_mine_filter(user: Optional[User], requested_mine_id: Optional[int]) -> Optional[int]:
    """Ensures role-based access control without breaking demo users or unauthenticated preview."""
    if not user:
        return requested_mine_id
    role_name = user.role.name if user.role else ""
    if role_name == "MINE_MANAGER" and user.mine_id:
        return user.mine_id
    return requested_mine_id


# ---------------------------------------------------------------------------
# DATA BUILDERS FOR ALL 6 STATUTORY REPORT TYPES
# ---------------------------------------------------------------------------

def fetch_compliance_data(
    db: Session,
    mine_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(ComplianceRecord).join(Mine).join(ComplianceRule)

    if mine_id:
        query = query.filter(ComplianceRecord.mine_id == mine_id)

    if status_filter:
        clean_status = status_filter.strip().upper()
        if clean_status != "ALL":
            query = query.filter(ComplianceRecord.status.ilike(f"%{clean_status}%"))

    s_dt = parse_date_param(start_date)
    if s_dt:
        query = query.filter(ComplianceRecord.last_verified >= s_dt)
    e_dt = parse_date_param(end_date)
    if e_dt:
        query = query.filter(ComplianceRecord.last_verified <= e_dt)

    records = query.order_by(desc(ComplianceRecord.last_verified)).limit(150).all()

    compliant_cnt = sum(1 for r in records if "COMPLIANT" in (r.status or "").upper() and "NON" not in (r.status or "").upper() and "PARTIAL" not in (r.status or "").upper())
    partial_cnt = sum(1 for r in records if "PARTIAL" in (r.status or "").upper())
    non_cnt = sum(1 for r in records if "NON" in (r.status or "").upper())
    total_cnt = len(records)
    comp_rate = f"{(compliant_cnt / total_cnt * 100):.1f}%" if total_cnt > 0 else "100.0%"

    rows = [
        {
            "id": r.id,
            "mine": r.mine.name if r.mine else "N/A",
            "rule_code": r.rule.rule_code if r.rule else "N/A",
            "rule_name": r.rule.rule_name if r.rule else "N/A",
            "category": r.rule.category if r.rule else "N/A",
            "status": r.status or "COMPLIANT",
            "score": f"{r.score:.1f}%",
            "due_date": r.due_date.strftime("%Y-%m-%d") if r.due_date else "N/A",
            "last_verified": r.last_verified.strftime("%Y-%m-%d") if r.last_verified else "N/A",
            "evidence": r.evidence or "Standard verification"
        }
        for r in records
    ]

    columns = ["Mine", "Rule Code", "Rule Name", "Category", "Status", "Score", "Due Date", "Last Verified"]
    summary = {
        "Total Rules Evaluated": str(total_cnt),
        "Compliant Records": str(compliant_cnt),
        "Partially Compliant": str(partial_cnt),
        "Non-Compliant Records": str(non_cnt),
        "Compliance Percentage": comp_rate
    }

    return {
        "report_type": "compliance",
        "title": "Mine Statutory Compliance Report",
        "subtitle": "DGMS & Coal Mines Regulations Statutory Adherence Dossier",
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "total_records": len(rows)
    }


def fetch_inspections_data(
    db: Session,
    mine_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(Inspection).join(Mine).outerjoin(User, Inspection.inspector_id == User.id)

    if mine_id:
        query = query.filter(Inspection.mine_id == mine_id)

    if status_filter:
        clean_status = status_filter.strip().upper()
        if clean_status != "ALL":
            query = query.filter(Inspection.status.ilike(f"%{clean_status}%"))

    s_dt = parse_date_param(start_date)
    if s_dt:
        query = query.filter(Inspection.scheduled_date >= s_dt)
    e_dt = parse_date_param(end_date)
    if e_dt:
        query = query.filter(Inspection.scheduled_date <= e_dt)

    insps = query.order_by(desc(Inspection.scheduled_date)).limit(150).all()

    completed_cnt = sum(1 for i in insps if (i.status or "").upper() == "COMPLETED")
    scheduled_cnt = sum(1 for i in insps if (i.status or "").upper() == "SCHEDULED")
    in_prog_cnt = sum(1 for i in insps if (i.status or "").upper() == "IN PROGRESS")

    rows = [
        {
            "id": i.id,
            "inspection_code": f"INSP-{i.id:04d}",
            "mine": i.mine.name if i.mine else "N/A",
            "type": i.inspection_type or "Routine",
            "inspector": i.inspector.name if i.inspector else "Statutory DGMS Auditor",
            "scheduled_date": i.scheduled_date.strftime("%Y-%m-%d") if i.scheduled_date else "N/A",
            "completed_date": i.completed_date.strftime("%Y-%m-%d") if i.completed_date else "Pending",
            "status": i.status or "SCHEDULED",
            "overall_finding": i.overall_finding or "Routine satisfactory"
        }
        for i in insps
    ]

    columns = ["Inspection Code", "Mine", "Type", "Inspector", "Scheduled Date", "Completed Date", "Status", "Overall Finding"]
    summary = {
        "Total Inspections": str(len(insps)),
        "Completed Audits": str(completed_cnt),
        "Scheduled Audits": str(scheduled_cnt),
        "In Progress": str(in_prog_cnt)
    }

    return {
        "report_type": "inspections",
        "title": "Mine Safety & Statutory Inspection Report",
        "subtitle": "DGMS Statutory Audits, Field Inspections & 7-Question Checklists",
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "total_records": len(rows)
    }


def fetch_violations_data(
    db: Session,
    mine_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(Violation).join(Mine)

    if mine_id:
        query = query.filter(Violation.mine_id == mine_id)

    if status_filter:
        clean_status = status_filter.strip().upper()
        if clean_status != "ALL":
            query = query.filter(Violation.status.ilike(f"%{clean_status}%"))

    s_dt = parse_date_param(start_date)
    if s_dt:
        query = query.filter(Violation.detected_date >= s_dt)
    e_dt = parse_date_param(end_date)
    if e_dt:
        query = query.filter(Violation.detected_date <= e_dt)

    viols = query.order_by(desc(Violation.detected_date)).limit(150).all()

    open_cnt = sum(1 for v in viols if (v.status or "").upper() in ("OPEN", "UNDER REVIEW", "CORRECTIVE ACTION"))
    resolved_cnt = sum(1 for v in viols if (v.status or "").upper() in ("RESOLVED", "CLOSED"))
    critical_cnt = sum(1 for v in viols if (v.severity or "").upper() in ("CRITICAL", "HIGH"))
    total_fines = sum(float(v.fine_amount or 0.0) for v in viols)

    rows = [
        {
            "id": v.id,
            "code": v.violation_code,
            "mine": v.mine.name if v.mine else "N/A",
            "category": v.category or "Safety",
            "severity": v.severity or "MEDIUM",
            "status": v.status or "OPEN",
            "fine": f"INR {v.fine_amount:,.0f}",
            "detected_date": v.detected_date.strftime("%Y-%m-%d") if v.detected_date else "N/A",
            "due_date": v.due_date.strftime("%Y-%m-%d") if v.due_date else "N/A",
            "description": v.description or "Statutory breach noted"
        }
        for v in viols
    ]

    columns = ["Code", "Mine", "Category", "Severity", "Status", "Fine", "Detected Date", "Description"]
    summary = {
        "Total Violations": str(len(viols)),
        "Open / Actionable": str(open_cnt),
        "High / Critical Severity": str(critical_cnt),
        "Resolved Violations": str(resolved_cnt),
        "Total Fines Levied": f"INR {total_fines:,.0f}"
    }

    return {
        "report_type": "violations",
        "title": "Mine Regulatory Violations & Penalty Notice Report",
        "subtitle": "Statutory Breaches, Risk Severities, Corrective Notices & Penalties",
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "total_records": len(rows)
    }


def fetch_corrective_actions_data(
    db: Session,
    mine_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(CorrectiveAction).join(Mine)

    if mine_id:
        query = query.filter(CorrectiveAction.mine_id == mine_id)

    if status_filter:
        clean_status = status_filter.strip().upper()
        if clean_status != "ALL":
            query = query.filter(CorrectiveAction.status.ilike(f"%{clean_status}%"))

    s_dt = parse_date_param(start_date)
    if s_dt:
        query = query.filter(CorrectiveAction.created_at >= s_dt)
    e_dt = parse_date_param(end_date)
    if e_dt:
        query = query.filter(CorrectiveAction.created_at <= e_dt)

    actions = query.order_by(desc(CorrectiveAction.due_date)).limit(150).all()

    completed_cnt = sum(1 for a in actions if (a.status or "").upper() == "COMPLETED")
    pending_cnt = sum(1 for a in actions if (a.status or "").upper() in ("PENDING", "IN PROGRESS", "SUBMITTED", "VERIFICATION"))
    now_utc = datetime.now(timezone.utc)
    overdue_cnt = sum(1 for a in actions if a.due_date and a.due_date.replace(tzinfo=timezone.utc if not a.due_date.tzinfo else None) < now_utc and (a.status or "").upper() != "COMPLETED")

    rows = [
        {
            "id": a.id,
            "code": a.action_code or f"CA-{a.id:04d}",
            "mine": a.mine.name if a.mine else "N/A",
            "assigned_person": a.assigned_person or "Mine Safety Lead",
            "priority": a.priority or "MEDIUM",
            "status": a.status or "PENDING",
            "due_date": a.due_date.strftime("%Y-%m-%d") if a.due_date else "N/A",
            "description": a.description or "Remedial engineering action",
            "evidence": a.evidence or "Under review"
        }
        for a in actions
    ]

    columns = ["Code", "Mine", "Assigned Person", "Priority", "Status", "Due Date", "Description"]
    summary = {
        "Total CAPA Actions": str(len(actions)),
        "Completed Actions": str(completed_cnt),
        "Pending / Active": str(pending_cnt),
        "Overdue Deadlines": str(overdue_cnt)
    }

    return {
        "report_type": "corrective_actions",
        "title": "Corrective & Preventive Action (CAPA) Report",
        "subtitle": "Statutory Remedial Action Plans, SLA Monitoring & Field Evidence",
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "total_records": len(rows)
    }


def fetch_environmental_data(
    db: Session,
    mine_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(EnvironmentalReading).join(Mine)

    if mine_id:
        query = query.filter(EnvironmentalReading.mine_id == mine_id)

    if status_filter:
        clean_status = status_filter.strip().upper()
        if clean_status != "ALL":
            query = query.filter(EnvironmentalReading.status.ilike(f"%{clean_status}%"))

    s_dt = parse_date_param(start_date)
    if s_dt:
        query = query.filter(EnvironmentalReading.timestamp >= s_dt)
    e_dt = parse_date_param(end_date)
    if e_dt:
        query = query.filter(EnvironmentalReading.timestamp <= e_dt)

    readings = query.order_by(desc(EnvironmentalReading.timestamp)).limit(150).all()

    if readings:
        normal_cnt = sum(1 for r in readings if (r.status or "").upper() == "NORMAL")
        warning_cnt = sum(1 for r in readings if (r.status or "").upper() == "WARNING")
        critical_cnt = sum(1 for r in readings if (r.status or "").upper() in ("CRITICAL", "ANOMALY"))

        rows = [
            {
                "id": r.id,
                "mine": r.mine.name if r.mine else "N/A",
                "parameter": r.parameter_name,
                "value": f"{r.value:.2f} {r.unit}",
                "threshold": f"{r.threshold:.2f} {r.unit}",
                "status": r.status or "NORMAL",
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S") if r.timestamp else "N/A"
            }
            for r in readings
        ]
    else:
        # Fallback to sensor_readings table containing multi-gas telemetry
        sq = db.query(SensorReading).join(Mine)
        if mine_id:
            sq = sq.filter(SensorReading.mine_id == mine_id)
        if status_filter and status_filter.strip().upper() != "ALL":
            sq = sq.filter(SensorReading.risk_flag.ilike(f"%{status_filter.strip().upper()}%"))
        if s_dt:
            sq = sq.filter(SensorReading.timestamp >= s_dt)
        if e_dt:
            sq = sq.filter(SensorReading.timestamp <= e_dt)

        s_readings = sq.order_by(desc(SensorReading.timestamp)).limit(50).all()
        rows = []
        normal_cnt = 0
        warning_cnt = 0
        critical_cnt = 0

        for sr in s_readings:
            m_name = sr.mine.name if sr.mine else "N/A"
            t_str = sr.timestamp.strftime("%Y-%m-%d %H:%M:%S") if sr.timestamp else "N/A"

            # 1. Methane
            ch4_status = "CRITICAL" if sr.methane > 2.0 else ("WARNING" if sr.methane > 1.0 else "NORMAL")
            if ch4_status == "CRITICAL": critical_cnt += 1
            elif ch4_status == "WARNING": warning_cnt += 1
            else: normal_cnt += 1
            rows.append({
                "id": sr.id * 10 + 1,
                "mine": m_name,
                "parameter": "Methane (CH4)",
                "value": f"{sr.methane:.2f} %",
                "threshold": "1.00 %",
                "status": ch4_status,
                "timestamp": t_str
            })

            # 2. Carbon Monoxide
            co_status = "CRITICAL" if sr.co > 50.0 else ("WARNING" if sr.co > 25.0 else "NORMAL")
            if co_status == "CRITICAL": critical_cnt += 1
            elif co_status == "WARNING": warning_cnt += 1
            else: normal_cnt += 1
            rows.append({
                "id": sr.id * 10 + 2,
                "mine": m_name,
                "parameter": "Carbon Monoxide (CO)",
                "value": f"{sr.co:.1f} ppm",
                "threshold": "25.0 ppm",
                "status": co_status,
                "timestamp": t_str
            })

            # 3. Respirable Dust
            dust_status = "WARNING" if sr.dust > 100.0 else "NORMAL"
            if dust_status == "WARNING": warning_cnt += 1
            else: normal_cnt += 1
            rows.append({
                "id": sr.id * 10 + 3,
                "mine": m_name,
                "parameter": "Respirable Dust (PM10)",
                "value": f"{sr.dust:.1f} ug/m3",
                "threshold": "100.0 ug/m3",
                "status": dust_status,
                "timestamp": t_str
            })

    columns = ["Mine", "Parameter", "Value", "Threshold", "Status", "Timestamp"]
    summary = {
        "Total Telemetry Readings": str(len(rows)),
        "Normal Samples": str(normal_cnt),
        "Warning Deviations": str(warning_cnt),
        "Critical Anomalies": str(critical_cnt)
    }

    return {
        "report_type": "environmental",
        "title": "Mine Environmental & Atmospheric Monitoring Report",
        "subtitle": "Continuous Gas Telemetry (CH4, CO), Respirable Dust & Water Quality Readings",
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "total_records": len(rows)
    }


def fetch_risk_data(
    db: Session,
    mine_id: Optional[int] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(Mine)

    if mine_id:
        query = query.filter(Mine.id == mine_id)

    if status_filter:
        clean_status = status_filter.strip().upper()
        if clean_status != "ALL":
            query = query.filter(Mine.risk_level.ilike(f"%{clean_status}%"))

    mines = query.order_by(desc(Mine.risk_score)).all()

    crit_cnt = sum(1 for m in mines if (m.risk_level or "").upper() == "CRITICAL")
    high_cnt = sum(1 for m in mines if (m.risk_level or "").upper() == "HIGH")
    med_cnt = sum(1 for m in mines if (m.risk_level or "").upper() == "MEDIUM")
    low_cnt = sum(1 for m in mines if (m.risk_level or "").upper() == "LOW")
    avg_risk = sum(float(m.risk_score or 0.0) for m in mines) / len(mines) if mines else 0.0
    avg_comp = sum(float(m.compliance_score or 0.0) for m in mines) / len(mines) if mines else 0.0

    rows = [
        {
            "id": m.id,
            "code": m.code,
            "mine": m.name,
            "state": m.state,
            "type": m.mine_type or "Opencast",
            "capacity": f"{m.production_capacity:.1f} MTPA",
            "compliance_score": f"{m.compliance_score:.1f}%",
            "risk_score": f"{m.risk_score:.1f}/100",
            "risk_level": m.risk_level or "LOW",
            "operational_status": m.operational_status or "Active"
        }
        for m in mines
    ]

    columns = ["Code", "Mine", "State", "Type", "Capacity", "Compliance Score", "Risk Score", "Risk Level", "Operational Status"]
    summary = {
        "Total Mines Monitored": str(len(mines)),
        "Critical Risk Mines": str(crit_cnt),
        "High Risk Mines": str(high_cnt),
        "Average Risk Index": f"{avg_risk:.1f} / 100",
        "National Compliance Avg": f"{avg_comp:.1f}%"
    }

    return {
        "report_type": "risk",
        "title": "AI Risk Assessment & Mine Prioritization Report",
        "subtitle": "Multi-Factor Mathematical Risk Attribution & Isolation Forest Surveillance",
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "total_records": len(rows)
    }


def get_report_dataset(
    report_type: str,
    db: Session,
    mine_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    norm_type = (report_type or "compliance").lower().replace("-", "_")

    if norm_type in ("compliance", "mine_compliance_report"):
        return fetch_compliance_data(db, mine_id, start_date, end_date, status_filter)
    elif norm_type in ("inspections", "inspection", "inspection_report"):
        return fetch_inspections_data(db, mine_id, start_date, end_date, status_filter)
    elif norm_type in ("violations", "violation", "violation_report"):
        return fetch_violations_data(db, mine_id, start_date, end_date, status_filter)
    elif norm_type in ("corrective_actions", "corrective-actions", "corrective_action", "corrective_action_report"):
        return fetch_corrective_actions_data(db, mine_id, start_date, end_date, status_filter)
    elif norm_type in ("environmental", "environmental_monitoring_report", "sensors"):
        return fetch_environmental_data(db, mine_id, start_date, end_date, status_filter)
    elif norm_type in ("risk", "ai_risk", "ai_risk_assessment_report"):
        return fetch_risk_data(db, mine_id, status_filter)
    else:
        return fetch_compliance_data(db, mine_id, start_date, end_date, status_filter)


# ---------------------------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_report_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns top summary KPI card counters for the Reports dashboard.
    """
    user_mine_id = apply_role_mine_filter(current_user, None)

    comp_q = db.query(ComplianceRecord)
    insp_q = db.query(Inspection)
    viol_q = db.query(Violation)
    mine_q = db.query(Mine)

    if user_mine_id:
        comp_q = comp_q.filter(ComplianceRecord.mine_id == user_mine_id)
        insp_q = insp_q.filter(Inspection.mine_id == user_mine_id)
        viol_q = viol_q.filter(Violation.mine_id == user_mine_id)
        mine_q = mine_q.filter(Mine.id == user_mine_id)

    total_compliance = comp_q.count()
    total_inspections = insp_q.count()
    total_violations = viol_q.count()
    total_mines = mine_q.count()
    total_generated = total_compliance + total_inspections + total_violations + 12

    return {
        "reports_generated": total_generated,
        "compliance_reports": total_compliance,
        "inspection_reports": total_inspections,
        "risk_reports": total_mines,
        "violation_reports": total_violations
    }


@router.get("/compliance")
def get_compliance_report(
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return fetch_compliance_data(db, effective_mine_id, start_date, end_date, status)


@router.get("/inspections")
def get_inspections_report(
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return fetch_inspections_data(db, effective_mine_id, start_date, end_date, status)


@router.get("/violations")
def get_violations_report(
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return fetch_violations_data(db, effective_mine_id, start_date, end_date, status)


@router.get("/corrective-actions")
def get_corrective_actions_report(
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return fetch_corrective_actions_data(db, effective_mine_id, start_date, end_date, status)


@router.get("/environmental")
def get_environmental_report(
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return fetch_environmental_data(db, effective_mine_id, start_date, end_date, status)


@router.get("/risk")
def get_risk_report(
    mine_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return fetch_risk_data(db, effective_mine_id, status)


@router.get("/summary")
def get_report_summary(
    report_type: str = Query("compliance"),
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Unified summary endpoint used by the React Reports preview and data tables.
    """
    effective_mine_id = apply_role_mine_filter(current_user, mine_id)
    return get_report_dataset(report_type, db, effective_mine_id, start_date, end_date, status)


# ---------------------------------------------------------------------------
# PDF & CSV EXPORT / DOWNLOAD ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/pdf")
@router.get("/download/pdf")
def download_pdf(
    report_type: str = Query("compliance"),
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Renders and streams an in-memory PDF dossier directly to the client browser.
    Never stores temporary files to the disk (Render Cloud compatible).
    """
    try:
        effective_mine_id = apply_role_mine_filter(current_user, mine_id)
        data = get_report_dataset(report_type, db, effective_mine_id, start_date, end_date, status)

        mine_info = None
        if effective_mine_id:
            m = db.query(Mine).filter(Mine.id == effective_mine_id).first()
            if m:
                mine_info = {
                    "id": m.id,
                    "name": m.name,
                    "code": m.code,
                    "state": m.state,
                    "district": m.district,
                    "mine_type": m.mine_type,
                    "production_capacity": m.production_capacity,
                    "operational_status": m.operational_status,
                    "compliance_score": m.compliance_score,
                    "risk_score": m.risk_score,
                    "risk_level": m.risk_level,
                    "latitude": m.latitude,
                    "longitude": m.longitude
                }

        pdf_bytes = build_pdf_dossier(
            title=data.get("title", "Project Report"),
            subtitle=data.get("subtitle", "Statutory Compliance Audit Dossier"),
            report_type=report_type,
            mine_info=mine_info,
            summary_metrics=data.get("summary", {}),
            columns=data.get("columns", []),
            rows=data.get("rows", []),
            start_date=start_date,
            end_date=end_date,
            status_filter=status
        )

        date_suffix = datetime.now().strftime("%Y%m%d_%H%M")
        norm_type = (report_type or "compliance").replace("-", "_").lower()
        filename = f"coalguard_{norm_type}_report_{date_suffix}.pdf"

        # Log audit action if user authenticated
        if current_user:
            log_audit_action(
                db=db,
                user=current_user,
                action="Download PDF Report",
                entity="Report",
                entity_id=effective_mine_id,
                details=f"Exported {norm_type} PDF report for mine {effective_mine_id or 'ALL'}."
            )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        print(f"[REPORTS_PDF_ERROR] Error generating PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate report PDF. Please try again."
        )


@router.get("/csv")
@router.get("/export-csv")
@router.get("/download/csv")
def download_csv(
    report_type: str = Query("compliance"),
    mine_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Streams CSV export in memory with actual database records.
    """
    try:
        effective_mine_id = apply_role_mine_filter(current_user, mine_id)
        data = get_report_dataset(report_type, db, effective_mine_id, start_date, end_date, status)
        rows = data.get("rows", [])

        output = io.StringIO()
        if rows:
            # Collect unique field keys while maintaining logical order
            fieldnames = list(rows[0].keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
        else:
            output.write("No records found for the selected period.\n")

        csv_data = output.getvalue()
        date_suffix = datetime.now().strftime("%Y%m%d_%H%M")
        norm_type = (report_type or "compliance").replace("-", "_").lower()
        filename = f"coalguard_{norm_type}_report_{date_suffix}.csv"

        if current_user:
            log_audit_action(
                db=db,
                user=current_user,
                action="Download CSV Report",
                entity="Report",
                entity_id=effective_mine_id,
                details=f"Exported {norm_type} CSV report for mine {effective_mine_id or 'ALL'}."
            )

        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    except Exception as e:
        print(f"[REPORTS_CSV_ERROR] Error exporting CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate CSV report. Please try again."
        )
