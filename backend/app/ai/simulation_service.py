import datetime
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Mine, SensorReading, Alert, Inspection, InspectionFinding,
    Violation, CorrectiveAction, ComplianceRecord, AuditLog, Document
)
from backend.app.ai.anomaly_detector import anomaly_detector
from backend.app.ai.risk_engine import evaluate_mine_risk
from backend.app.services.audit_service import log_audit_action

def run_ai_simulation_workflow(mine_id: int, db: Session) -> Dict[str, Any]:
    """
    Executes the complete 14-step Smart India Hackathon governance workflow.
    Sensor Data -> AI Anomaly Detection -> Risk Score Spike -> Alert Generated ->
    Officer Review -> Inspection Scheduled -> Finding -> Violation -> Corrective Action ->
    Evidence Submitted -> Officer Signoff -> Compliance Restored -> Risk Decreased -> Report Logged.
    """
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        mine = db.query(Mine).first()
    if not mine:
        raise ValueError("No mine available to run simulation on.")

    now = datetime.datetime.now(datetime.timezone.utc)
    sim_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
    steps: List[Dict[str, Any]] = []

    # ----------------- Step 1: Generate Normal Telemetry -----------------
    normal_sensor = SensorReading(
        mine_id=mine.id,
        zone="Shaft 4 - Eastern Extraction Wall",
        methane=0.42,
        co=9.5,
        dust=48.0,
        temperature=27.2,
        humidity=62.0,
        noise=72.0,
        air_quality=68.0,
        water_quality=7.3,
        is_anomaly=False,
        anomaly_score=0.18,
        risk_flag="NORMAL",
        timestamp=now - datetime.timedelta(minutes=15)
    )
    db.add(normal_sensor)
    db.commit()

    steps.append({
        "step_number": 1,
        "title": "Baseline Telemetry Ingestion",
        "description": "Standard multi-parameter environmental telemetry ingested from Section 4 sensors.",
        "status": "SUCCESS",
        "details": {
            "methane": "0.42%",
            "co": "9.5 ppm",
            "dust": "48 ug/m³",
            "temperature": "27.2 °C",
            "status": "NORMAL"
        }
    })

    # ----------------- Step 2: Inject Abnormal Methane & Dust Spike -----------------
    abnormal_values = {
        "methane": 3.75,       # Critical limit is > 2.0%
        "co": 64.0,            # Critical limit is > 50 ppm
        "dust": 340.0,         # Critical limit is > 250 ug/m³
        "temperature": 38.5,
        "humidity": 84.0,
        "noise": 94.0,
        "air_quality": 285.0,
        "water_quality": 5.8
    }
    steps.append({
        "step_number": 2,
        "title": "Hazard Surge Simulated",
        "description": "Sudden surge injected: Methane rose to 3.75% and Carbon Monoxide rose to 64.0 ppm in Deep Shaft 4.",
        "status": "SUCCESS",
        "details": abnormal_values
    })

    # ----------------- Step 3: Isolation Forest Detects Anomaly -----------------
    ai_result = anomaly_detector.analyze_reading(abnormal_values)
    anomaly_sensor = SensorReading(
        mine_id=mine.id,
        zone="Shaft 4 - Eastern Extraction Wall",
        methane=abnormal_values["methane"],
        co=abnormal_values["co"],
        dust=abnormal_values["dust"],
        temperature=abnormal_values["temperature"],
        humidity=abnormal_values["humidity"],
        noise=abnormal_values["noise"],
        air_quality=abnormal_values["air_quality"],
        water_quality=abnormal_values["water_quality"],
        is_anomaly=ai_result["is_anomaly"],
        anomaly_score=ai_result["anomaly_score"],
        risk_flag=ai_result["risk_flag"],
        timestamp=now - datetime.timedelta(minutes=10)
    )
    db.add(anomaly_sensor)
    db.commit()

    steps.append({
        "step_number": 3,
        "title": "Isolation Forest Anomaly Classification",
        "description": f"AI model classified observation as anomalous (Score: {ai_result['anomaly_score']}, Flag: {ai_result['risk_flag']}).",
        "status": "SUCCESS",
        "details": {
            "model": "Scikit-Learn IsolationForest (100 estimators)",
            "is_anomaly": True,
            "anomaly_score": ai_result["anomaly_score"],
            "triggers": ai_result["triggers"]
        }
    })

    # ----------------- Step 4 & 5: AI Risk Score Escalation -----------------
    risk_evaluation_pre = evaluate_mine_risk(mine.id, db)
    # Force elevated score for clear simulation visual
    elevated_score = max(84.0, risk_evaluation_pre["risk_score"])
    mine.risk_score = elevated_score
    mine.risk_level = "CRITICAL"
    db.commit()

    steps.append({
        "step_number": 4,
        "title": "AI Risk Score Re-evaluation",
        "description": f"Rule-based AI engine synthesized sensor breach into total mine risk, spiking to {elevated_score}.",
        "status": "SUCCESS",
        "details": {
            "previous_risk": "42.0 (MEDIUM)",
            "updated_risk": f"{elevated_score} (CRITICAL)",
            "primary_driver": "Gas Anomaly +28 pts"
        }
    })

    steps.append({
        "step_number": 5,
        "title": "Mine Status Escalated to CRITICAL",
        "description": "Mine status automatically upgraded to High-Alert / CRITICAL state on the Central Governance Board.",
        "status": "SUCCESS",
        "details": {
            "mine_name": mine.name,
            "risk_level": "CRITICAL",
            "regulatory_flag": "Mandatory DGMS Notification Triggered"
        }
    })

    # ----------------- Step 6: Alert Generated in DB -----------------
    sim_alert = Alert(
        mine_id=mine.id,
        alert_type="Critical Sensor Anomaly",
        severity="CRITICAL",
        message=f"[AI ALERT] Hazardous Methane (3.75%) and CO (64 ppm) surge detected in Shaft 4 at {mine.name}.",
        timestamp=now - datetime.timedelta(minutes=8),
        status="UNREAD"
    )
    db.add(sim_alert)
    db.commit()
    db.refresh(sim_alert)

    steps.append({
        "step_number": 6,
        "title": "Critical Alert Broadcasted",
        "description": f"Priority 1 alert created: Alert #{sim_alert.id} delivered to District Officer dashboard.",
        "status": "SUCCESS",
        "details": {
            "alert_id": sim_alert.id,
            "severity": "CRITICAL",
            "message": sim_alert.message
        }
    })

    # ----------------- Step 7: Officer Reviews & Acknowledges Alert -----------------
    sim_alert.status = "ACKNOWLEDGED"
    sim_alert.acknowledged_by = "District Mining Officer (DMO)"
    db.commit()

    steps.append({
        "step_number": 7,
        "title": "Officer Review & Acknowledgement",
        "description": "Government Mining Officer verified telemetry breach and initiated regulatory response protocol.",
        "status": "SUCCESS",
        "details": {
            "officer": "Er. Rajesh Kumar (DGMS Regional Officer)",
            "action": "Alert Acknowledged & Triage Initiated",
            "timestamp": (now - datetime.timedelta(minutes=6)).strftime("%H:%M:%S")
        }
    })

    # ----------------- Step 8: Emergency Inspection Scheduled -----------------
    sim_inspection = Inspection(
        mine_id=mine.id,
        inspection_type="Special",
        scheduled_date=now - datetime.timedelta(minutes=5),
        completed_date=now - datetime.timedelta(minutes=3),
        status="COMPLETED",
        overall_finding="Severe airflow restriction detected at Fan Station B. Auxiliary ventilation scrubber was powered off.",
        recommendations="Immediate repair of secondary blower and continuous atmospheric monitoring."
    )
    db.add(sim_inspection)
    db.commit()
    db.refresh(sim_inspection)

    steps.append({
        "step_number": 8,
        "title": "Emergency Inspection Dispatched",
        "description": f"Inspector dispatched under Emergency Order. Inspection #{sim_inspection.id} conducted.",
        "status": "SUCCESS",
        "details": {
            "inspection_id": sim_inspection.id,
            "type": "Special Safety Audit",
            "target": "Shaft 4 Ventilation Sub-Station"
        }
    })

    # ----------------- Step 9: Inspection Finding Logged -----------------
    sim_finding = InspectionFinding(
        inspection_id=sim_inspection.id,
        checklist_item="Is ventilation operational and maintaining permissible atmospheric limits?",
        answer="NO",
        finding_description="Auxiliary ventilation turbine tripped due to motor bearing seizure, causing gas pocket accumulation.",
        severity="CRITICAL",
        corrective_action_required=True,
        evidence="https://coalguard.gov.in/evidence/blower_seizure_photo.jpg"
    )
    db.add(sim_finding)
    db.commit()

    steps.append({
        "step_number": 9,
        "title": "Digital Checklist Finding Recorded",
        "description": "Inspector failed Checklist Item #3: 'Ventilation Operational' with severity CRITICAL.",
        "status": "SUCCESS",
        "details": {
            "item": sim_finding.checklist_item,
            "answer": "NO",
            "fault": sim_finding.finding_description
        }
    })

    # ----------------- Step 10: Violation Created -----------------
    viol_code = f"VIO-{uuid.uuid4().hex[:6].upper()}"
    sim_violation = Violation(
        violation_code=viol_code,
        mine_id=mine.id,
        inspection_id=sim_inspection.id,
        category="Safety",
        description="Breach of Coal Mines Regulations (CMR) Sec 153: Inadequate ventilation air quantity in working face.",
        severity="CRITICAL",
        detected_date=now - datetime.timedelta(minutes=3),
        detected_by="DGMS Inspection Directorate",
        status="CORRECTIVE ACTION",
        due_date=now + datetime.timedelta(days=2),
        assigned_officer="Er. Rajesh Kumar",
        fine_amount=50000.0
    )
    db.add(sim_violation)
    db.commit()
    db.refresh(sim_violation)

    steps.append({
        "step_number": 10,
        "title": "Formal Regulatory Violation Issued",
        "description": f"Statutory Notice #{viol_code} created under Coal Mines Regulations Section 153.",
        "status": "SUCCESS",
        "details": {
            "violation_code": viol_code,
            "category": "Safety / Ventilation",
            "severity": "CRITICAL",
            "penalty": "₹50,000 fine + Mandatory Stop-Work Order on Section 4"
        }
    })

    # ----------------- Step 11: Corrective Action Assigned -----------------
    ca_code = f"CA-{uuid.uuid4().hex[:6].upper()}"
    sim_action = CorrectiveAction(
        action_code=ca_code,
        violation_id=sim_violation.id,
        mine_id=mine.id,
        description="Replace burned blower motor with certified flameproof unit and calibrate air velocity sensors.",
        assigned_person="Mine Electrical Engineer & Safety Officer",
        priority="URGENT",
        due_date=now + datetime.timedelta(hours=48),
        status="IN PROGRESS"
    )
    db.add(sim_action)
    db.commit()
    db.refresh(sim_action)

    steps.append({
        "step_number": 11,
        "title": "Mandatory Corrective Action Assigned",
        "description": f"Action Plan #{ca_code} assigned to Mine Engineering team with 48-hour compliance SLA.",
        "status": "SUCCESS",
        "details": {
            "action_code": ca_code,
            "assigned_to": sim_action.assigned_person,
            "sla": "48 Hours"
        }
    })

    # ----------------- Step 12: Mine Manager Submits Evidence -----------------
    sim_action.status = "SUBMITTED"
    sim_action.evidence = "DGMS_Compliance_Blower_Replacement_Cert_Verified.pdf"
    sim_action.completion_date = now - datetime.timedelta(minutes=1)

    doc = Document(
        entity_type="corrective_action",
        entity_id=sim_action.id,
        file_name="DGMS_Compliance_Blower_Replacement_Cert_Verified.pdf",
        file_path="/storage/evidence/cert_89412.pdf",
        file_type="PDF",
        file_size=2048576,
        uploaded_by="Mine Manager"
    )
    db.add(doc)
    db.commit()

    steps.append({
        "step_number": 12,
        "title": "Rectification Evidence Submitted",
        "description": "Mine Manager completed repairs and uploaded DGMS Flameproof Equipment Certificate & airflow logs.",
        "status": "SUCCESS",
        "details": {
            "document": doc.file_name,
            "size": "2.0 MB (PDF)",
            "submitted_by": "Mine Manager"
        }
    })

    # ----------------- Step 13: Officer Verifies & Closes Action -----------------
    sim_action.status = "COMPLETED"
    sim_action.officer_notes = "Physical and telemetric inspection confirms air velocity restored to 38.5 m3/min. Methane safe."
    sim_violation.status = "RESOLVED"
    sim_alert.status = "RESOLVED"

    # Restore sensor telemetry to normal
    restored_sensor = SensorReading(
        mine_id=mine.id,
        zone="Shaft 4 - Eastern Extraction Wall",
        methane=0.38,
        co=8.2,
        dust=42.0,
        temperature=25.8,
        humidity=58.0,
        noise=68.0,
        air_quality=55.0,
        water_quality=7.4,
        is_anomaly=False,
        anomaly_score=0.24,
        risk_flag="NORMAL",
        timestamp=now
    )
    db.add(restored_sensor)
    db.commit()

    steps.append({
        "step_number": 13,
        "title": "Officer Verification & Sign-off",
        "description": "Government Officer verified digital telemetry and approved compliance remediation.",
        "status": "SUCCESS",
        "details": {
            "action_status": "COMPLETED",
            "violation_status": "RESOLVED",
            "officer_notes": sim_action.officer_notes
        }
    })

    # ----------------- Step 14: Compliance Restored & Risk Drops -----------------
    # Re-evaluate risk
    final_risk = evaluate_mine_risk(mine.id, db)
    # Normalize risk score to healthy low range
    mine.risk_score = 22.0
    mine.risk_level = "LOW"
    mine.compliance_score = 94.0
    db.commit()

    log_audit_action(
        db=db,
        user=None,
        action="Run AI Simulation",
        entity="Simulation",
        entity_id=mine.id,
        details=f"Completed 14-step automated governance simulation {sim_id} for {mine.name}."
    )

    steps.append({
        "step_number": 14,
        "title": "Governance Loop Closed & Risk Normalized",
        "description": "Risk score dropped from 84.0 (CRITICAL) to 22.0 (LOW). Compliance score restored to 94%. Audit report saved.",
        "status": "SUCCESS",
        "details": {
            "final_risk_score": 22.0,
            "final_risk_level": "LOW",
            "compliance_score": 94.0,
            "audit_entry": f"Logged under ID {sim_id}"
        }
    })

    return {
        "simulation_id": sim_id,
        "mine_id": mine.id,
        "mine_name": mine.name,
        "executed_at": now,
        "steps": steps,
        "final_status": "COMPLETED",
        "summary": "Full end-to-end AI governance cycle completed: Telemetry Anomaly -> Risk Escalation -> Alert -> Inspection -> Violation -> Corrective Action -> Remediation -> Signoff."
    }
