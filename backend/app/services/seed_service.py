import datetime
import random
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Role, User, Mine, MineLocation, ComplianceRule, ComplianceRecord,
    Inspection, InspectionFinding, Violation, CorrectiveAction,
    SensorReading, EnvironmentalReading, SafetyIncident, Alert, Document, AuditLog
)
from backend.app.services.auth_service import hash_password

def seed_database_if_empty(db: Session):
    # Check if database already seeded
    if db.query(Mine).count() >= 10:
        return

    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. Seed Roles
    roles_data = [
        {"name": "SUPER_ADMIN", "description": "National Coal Controller and System Administrator"},
        {"name": "GOVERNMENT_OFFICER", "description": "DGMS Regional & District Mining Officer"},
        {"name": "MINE_MANAGER", "description": "On-site Mine General Manager & Safety Lead"},
        {"name": "INSPECTOR", "description": "Statutory Mining & Environmental Inspector"}
    ]
    role_map = {}
    for r in roles_data:
        role = db.query(Role).filter(Role.name == r["name"]).first()
        if not role:
            role = Role(name=r["name"], description=r["description"])
            db.add(role)
            db.commit()
            db.refresh(role)
        role_map[r["name"]] = role

    # 2. Seed 10 Realistic Mines (Indian Coal Mining Belts: Jharkhand, Chhattisgarh, Odisha, MP, WB)
    mines_seed = [
        {
            "name": "Jharia Deep Seam Colliery",
            "code": "MINE-JH-01",
            "location": "Jharia Coalfield, Dhanbad",
            "district": "Dhanbad",
            "state": "Jharkhand",
            "mine_type": "Underground",
            "production_capacity": 2.4,
            "operational_status": "Active",
            "compliance_score": 78.5,
            "risk_score": 68.0,
            "risk_level": "HIGH",
            "latitude": 23.7500,
            "longitude": 86.4200
        },
        {
            "name": "Korba Super Pit Block-B",
            "code": "MINE-CG-02",
            "location": "Gevra Open Cast Complex, Korba",
            "district": "Korba",
            "state": "Chhattisgarh",
            "mine_type": "Opencast",
            "production_capacity": 6.8,
            "operational_status": "Active",
            "compliance_score": 92.0,
            "risk_score": 24.0,
            "risk_level": "LOW",
            "latitude": 22.3595,
            "longitude": 82.6841
        },
        {
            "name": "Singrauli Northern Ridge",
            "code": "MINE-MP-03",
            "location": "Jayant Mining Block, Singrauli",
            "district": "Singrauli",
            "state": "Madhya Pradesh",
            "mine_type": "Opencast",
            "production_capacity": 4.5,
            "operational_status": "Active",
            "compliance_score": 85.0,
            "risk_score": 38.0,
            "risk_level": "MEDIUM",
            "latitude": 24.1997,
            "longitude": 82.6644
        },
        {
            "name": "Talcher Valley Colliery",
            "code": "MINE-OD-04",
            "location": "Bhubaneswari Mine Area, Talcher",
            "district": "Angul",
            "state": "Odisha",
            "mine_type": "Opencast",
            "production_capacity": 5.2,
            "operational_status": "Active",
            "compliance_score": 89.0,
            "risk_score": 28.0,
            "risk_level": "LOW",
            "latitude": 20.9500,
            "longitude": 85.2200
        },
        {
            "name": "Raniganj Heritage Seam Shaft-7",
            "code": "MINE-WB-05",
            "location": "Asansol Mining Zone, Raniganj",
            "district": "Paschim Bardhaman",
            "state": "West Bengal",
            "mine_type": "Underground",
            "production_capacity": 1.2,
            "operational_status": "Under Review",
            "compliance_score": 64.0,
            "risk_score": 86.0,
            "risk_level": "CRITICAL",
            "latitude": 23.6190,
            "longitude": 87.1290
        },
        {
            "name": "Ib Valley Open Cast Sector-2",
            "code": "MINE-OD-06",
            "location": "Jharsuguda Coal Belt, Brajrajnagar",
            "district": "Jharsuguda",
            "state": "Odisha",
            "mine_type": "Opencast",
            "production_capacity": 3.8,
            "operational_status": "Active",
            "compliance_score": 88.5,
            "risk_score": 27.0,
            "risk_level": "LOW",
            "latitude": 21.8200,
            "longitude": 83.9200
        },
        {
            "name": "Kusmunda Mega Opencast",
            "code": "MINE-CG-07",
            "location": "Kusmunda Colliery, Korba",
            "district": "Korba",
            "state": "Chhattisgarh",
            "mine_type": "Opencast",
            "production_capacity": 7.5,
            "operational_status": "Active",
            "compliance_score": 82.0,
            "risk_score": 45.0,
            "risk_level": "MEDIUM",
            "latitude": 22.3100,
            "longitude": 82.6900
        },
        {
            "name": "Ramagundam OC-3 Project",
            "code": "MINE-TS-08",
            "location": "Godavari Valley Coalfield, Ramagundam",
            "district": "Peddapalli",
            "state": "Telangana",
            "mine_type": "Mixed",
            "production_capacity": 3.0,
            "operational_status": "Active",
            "compliance_score": 90.0,
            "risk_score": 25.0,
            "risk_level": "LOW",
            "latitude": 18.7600,
            "longitude": 79.4800
        },
        {
            "name": "Bokaro Bermo Deep Shaft",
            "code": "MINE-JH-09",
            "location": "East Bokaro Coalfield, Bermo",
            "district": "Bokaro",
            "state": "Jharkhand",
            "mine_type": "Underground",
            "production_capacity": 1.6,
            "operational_status": "Maintenance",
            "compliance_score": 72.0,
            "risk_score": 62.0,
            "risk_level": "HIGH",
            "latitude": 23.7700,
            "longitude": 85.9300
        },
        {
            "name": "Wardha Valley Ballarpur Colliery",
            "code": "MINE-MH-10",
            "location": "Chandrapur Coal Basin, Ballarpur",
            "district": "Chandrapur",
            "state": "Maharashtra",
            "mine_type": "Underground",
            "production_capacity": 1.8,
            "operational_status": "Active",
            "compliance_score": 81.0,
            "risk_score": 48.0,
            "risk_level": "MEDIUM",
            "latitude": 19.8500,
            "longitude": 79.3500
        }
    ]

    created_mines = []
    for m in mines_seed:
        existing = db.query(Mine).filter(Mine.code == m["code"]).first()
        if not existing:
            mine = Mine(
                name=m["name"],
                code=m["code"],
                location=m["location"],
                district=m["district"],
                state=m["state"],
                mine_type=m["mine_type"],
                production_capacity=m["production_capacity"],
                operational_status=m["operational_status"],
                compliance_score=m["compliance_score"],
                risk_score=m["risk_score"],
                risk_level=m["risk_level"],
                latitude=m["latitude"],
                longitude=m["longitude"],
                last_inspection=now - datetime.timedelta(days=random.randint(5, 60)),
                next_inspection=now + datetime.timedelta(days=random.randint(10, 45))
            )
            db.add(mine)
            db.commit()
            db.refresh(mine)
            created_mines.append(mine)
        else:
            created_mines.append(existing)

    # 3. Seed Demo Users
    demo_users = [
        {
            "name": "National Coal Controller (Admin)",
            "email": "admin@coalguard.gov.in",
            "password": "Admin@123",
            "role": "SUPER_ADMIN",
            "designation": "Director General of Mine Safety"
        },
        {
            "name": "Er. Rajesh Kumar",
            "email": "officer@coalguard.gov.in",
            "password": "Officer@123",
            "role": "GOVERNMENT_OFFICER",
            "designation": "Regional Mining Officer - DGMS"
        },
        {
            "name": "S. K. Mukherjee",
            "email": "manager@coalguard.gov.in",
            "password": "Manager@123",
            "role": "MINE_MANAGER",
            "mine_id": created_mines[0].id,
            "designation": "General Manager (Operations)"
        },
        {
            "name": "Amitabh Sen",
            "email": "inspector@coalguard.gov.in",
            "password": "Inspector@123",
            "role": "INSPECTOR",
            "designation": "Statutory Mine Safety Inspector"
        }
    ]

    for u in demo_users:
        if not db.query(User).filter(User.email == u["email"]).first():
            user = User(
                name=u["name"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                role_id=role_map[u["role"]].id,
                mine_id=u.get("mine_id"),
                designation=u.get("designation"),
                phone="+91-9876543210",
                is_active=True
            )
            db.add(user)
    db.commit()

    # 4. Seed Compliance Rules (Categories: Safety, Environmental, Equipment, Labour, Documentation, Emergency preparedness, Operational compliance)
    compliance_rules_seed = [
        ("RULE-SAF-01", "Flameproof Electrical Apparatus Certification", "Safety", "Mandatory DGMS certification for all underground electrical gear.", 20),
        ("RULE-SAF-02", "Underground Atmospheric Gas Threshold Monitoring", "Safety", "Real-time methane & CO sensors must be calibrated bi-weekly.", 25),
        ("RULE-SAF-03", "Auxiliary Ventilation & Air Circulation Compliance", "Safety", "Maintain minimum 15 m3/min airflow per worker at active coal face.", 25),
        ("RULE-SAF-04", "Strata Control & Roof Bolting Inspection", "Safety", "Routine testing of load indicators on roof support structures.", 15),
        ("RULE-ENV-01", "Effluent Treatment & Acid Mine Drainage Control", "Environmental", "Water discharge pH must strictly remain between 6.5 and 8.5.", 20),
        ("RULE-ENV-02", "Ambient Respirable Dust Concentration (PM10/PM2.5)", "Environmental", "Quarterly dust surveys and functioning high-pressure water mist cannons.", 15),
        ("RULE-ENV-03", "Overburden Topsoil Reclamation & Plantation", "Environmental", "Progressive backfilling and native afforestation on dump slopes.", 10),
        ("RULE-EQP-01", "Heavy Earth Moving Machinery (HEMM) Fitness", "Equipment", "Valid fitness certificates and operational automatic fire suppression systems (AFSS).", 15),
        ("RULE-EQP-02", "Haul Road Gradient and Bund Wall Height", "Equipment", "Berms must be at least equal to the largest dump truck tyre height.", 10),
        ("RULE-LAB-01", "Personal Protective Equipment (PPE) Compliance", "Labour", "Zero tolerance for workers operating without helmet, safety boots, cap lamp and dust mask.", 10),
        ("RULE-LAB-02", "Work Shift Rest Periods and Drinking Water Facility", "Labour", "Mandatory cool potable water stations within 150m of working zones.", 5),
        ("RULE-DOC-01", "Statutory Mine Working Plans & Sections Updating", "Documentation", "Mine layout plans updated on the first day of every quarter.", 10),
        ("RULE-DOC-02", "Explosives Magazine & Blasting Authorization Logs", "Documentation", "Daily stock reconciliation of detonators and emulsion explosives.", 20),
        ("RULE-EMG-01", "Emergency Refuge Chamber & Self-Contained Self-Rescuer (SCSR)", "Emergency preparedness", "Emergency escape pods stocked with 72h oxygen rations.", 25),
        ("RULE-EMG-02", "Bi-Annual Mine Inundation & Fire Mock Drills", "Emergency preparedness", "Compulsory evacuation drills conducted with records submitted to DGMS.", 15),
        ("RULE-OPR-01", "Controlled Deep Hole Blasting & Ground Vibration Limits", "Operational compliance", "Peak Particle Velocity (PPV) monitored via seismograph.", 15)
    ]

    rules_objs = []
    for code, name, cat, desc, pts in compliance_rules_seed:
        rule = db.query(ComplianceRule).filter(ComplianceRule.rule_code == code).first()
        if not rule:
            rule = ComplianceRule(
                rule_code=code,
                rule_name=name,
                category=cat,
                description=desc,
                penalty_points=pts,
                mandatory=True
            )
            db.add(rule)
            db.commit()
            db.refresh(rule)
        rules_objs.append(rule)

    # 5. Seed 50+ Compliance Records across mines
    statuses = ["COMPLIANT", "COMPLIANT", "COMPLIANT", "PARTIALLY COMPLIANT", "NON-COMPLIANT", "PENDING REVIEW"]
    for mine in created_mines:
        for rule in rules_objs[:6]: # 6 rules per mine = 60 records
            rec = ComplianceRecord(
                mine_id=mine.id,
                rule_id=rule.id,
                status=random.choice(statuses) if mine.risk_level != "LOW" else "COMPLIANT",
                score=95.0 if mine.risk_level == "LOW" else random.choice([40.0, 70.0, 85.0, 95.0]),
                due_date=now + datetime.timedelta(days=random.randint(15, 90)),
                last_verified=now - datetime.timedelta(days=random.randint(1, 40)),
                evidence=f"audit_evidence_{mine.code}_{rule.rule_code}.pdf",
                remarks=f"Verified during district compliance cycle for {rule.category}."
            )
            db.add(rec)
    db.commit()

    # 6. Seed 30+ Violations
    violation_categories = ["Safety", "Environmental", "Equipment", "Labour", "Emergency preparedness"]
    severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    violation_statuses = ["OPEN", "UNDER REVIEW", "CORRECTIVE ACTION", "RESOLVED", "CLOSED"]

    violation_templates = [
        ("Methane accumulation exceeding 1.2% in return airway", "Safety", "HIGH"),
        ("Defective water mist dust suppression nozzles at Coal Handling Plant", "Environmental", "MEDIUM"),
        ("Overburden bench height exceeded statutory limit of 12 meters", "Safety", "CRITICAL"),
        ("Inadequate emergency communication backup in Deep Shaft 3", "Emergency preparedness", "HIGH"),
        ("Acid mine water discharge observed into local nallah without neutralization", "Environmental", "CRITICAL"),
        ("Haul truck brake retarder test log missing for dumpers #42 and #47", "Equipment", "MEDIUM"),
        ("Workers observed in highwall zone without certified high-visibility gear", "Labour", "LOW"),
        ("Auxiliary ventilation fan stopped for 45 minutes without worker evacuation", "Safety", "CRITICAL"),
        ("Non-submission of quarterly water table monitoring telemetry to state board", "Environmental", "LOW"),
        ("Uninspected roof crack detected near Junction 14", "Safety", "HIGH")
    ]

    created_violations = []
    for i in range(35):
        mine = random.choice(created_mines)
        template = random.choice(violation_templates)
        viol_code = f"VIO-{mine.code.split('-')[1]}-{1000 + i}"
        status_val = random.choice(violation_statuses)
        sev = template[2] if mine.risk_level != "LOW" else "LOW"

        viol = Violation(
            violation_code=viol_code,
            mine_id=mine.id,
            category=template[1],
            description=f"{template[0]} observed during routine surveillance.",
            severity=sev,
            detected_date=now - datetime.timedelta(days=random.randint(2, 45)),
            detected_by="DGMS Inspection Directorate",
            status=status_val,
            due_date=now + datetime.timedelta(days=random.randint(3, 30)),
            assigned_officer="Er. Rajesh Kumar",
            fine_amount=random.choice([10000.0, 25000.0, 50000.0, 100000.0]) if sev in ["HIGH", "CRITICAL"] else 0.0
        )
        db.add(viol)
        created_violations.append(viol)
    db.commit()

    # 7. Seed 30+ Corrective Actions
    action_statuses = ["PENDING", "IN PROGRESS", "SUBMITTED", "VERIFICATION", "COMPLETED", "OVERDUE"]
    for i, viol in enumerate(created_violations[:32]):
        status_choice = random.choice(action_statuses)
        is_overdue = (status_choice == "OVERDUE")
        due = now - datetime.timedelta(days=random.randint(2, 10)) if is_overdue else now + datetime.timedelta(days=random.randint(5, 25))

        ca = CorrectiveAction(
            action_code=f"CA-2026-{100 + i}",
            violation_id=viol.id,
            mine_id=viol.mine_id,
            description=f"Rectification plan for {viol.violation_code}: Re-engineer and deploy safety safeguards with physical verification.",
            assigned_person=f"Engineer {random.choice(['V. Sharma', 'K. Murthy', 'P. Sengupta', 'A. Yadav'])}",
            priority=viol.severity if viol.severity != "CRITICAL" else "URGENT",
            due_date=due,
            completion_date=now - datetime.timedelta(days=1) if status_choice == "COMPLETED" else None,
            status=status_choice,
            evidence=f"rectification_evidence_{viol.violation_code}.pdf" if status_choice in ["SUBMITTED", "VERIFICATION", "COMPLETED"] else None,
            officer_notes="Remediation steps reviewed and deemed compliant." if status_choice == "COMPLETED" else None
        )
        db.add(ca)
    db.commit()

    # 8. Seed 25+ Inspections with Checklist Findings
    inspection_types = ["Routine", "Safety", "Environmental", "Special", "Follow-up"]
    inspection_statuses = ["COMPLETED", "COMPLETED", "IN PROGRESS", "SCHEDULED"]

    for i in range(28):
        mine = random.choice(created_mines)
        insp_type = random.choice(inspection_types)
        insp_status = random.choice(inspection_statuses)
        sched_date = now - datetime.timedelta(days=random.randint(5, 60)) if insp_status == "COMPLETED" else now + datetime.timedelta(days=random.randint(2, 20))

        insp = Inspection(
            mine_id=mine.id,
            inspection_type=insp_type,
            scheduled_date=sched_date,
            completed_date=sched_date + datetime.timedelta(hours=6) if insp_status == "COMPLETED" else None,
            status=insp_status,
            overall_finding="Compliance levels satisfactory with minor ventilation adjustments needed." if insp_status == "COMPLETED" else None,
            recommendations="Ensure continuous sensor calibration and strict adherence to roof bolting standards." if insp_status == "COMPLETED" else None
        )
        db.add(insp)
        db.commit()
        db.refresh(insp)

        # Add 3 checklist findings per inspection
        findings = [
            ("Is required safety equipment available?", "YES", None, "LOW", False),
            ("Is ventilation operational and maintaining limits?", "NO" if mine.risk_level == "CRITICAL" else "YES",
             "Airflow meter reading below statutory velocity" if mine.risk_level == "CRITICAL" else None,
             "HIGH" if mine.risk_level == "CRITICAL" else "LOW",
             mine.risk_level == "CRITICAL"),
            ("Are environmental controls functioning?", "YES", None, "LOW", False)
        ]
        for item, ans, desc, sev, ca_req in findings:
            finding = InspectionFinding(
                inspection_id=insp.id,
                checklist_item=item,
                answer=ans,
                finding_description=desc,
                severity=sev,
                corrective_action_required=ca_req
            )
            db.add(finding)
    db.commit()

    # 9. Seed 50+ Alerts
    alert_types = [
        "Critical Sensor Anomaly", "High Mine Risk", "Compliance Violation",
        "Overdue Corrective Action", "Upcoming Inspection", "Safety Incident"
    ]
    alert_statuses = ["UNREAD", "READ", "ACKNOWLEDGED", "RESOLVED"]

    for i in range(55):
        mine = random.choice(created_mines)
        atype = random.choice(alert_types)
        sev = "CRITICAL" if "Critical" in atype or mine.risk_level == "CRITICAL" else random.choice(severities)

        alert = Alert(
            mine_id=mine.id,
            alert_type=atype,
            severity=sev,
            message=f"[{atype.upper()}] Notified at {mine.name}: Automated compliance trigger requires supervisory attention.",
            timestamp=now - datetime.timedelta(hours=random.randint(1, 120)),
            status=random.choice(alert_statuses),
            acknowledged_by="District Mining Officer" if random.choice([True, False]) else None
        )
        db.add(alert)
    db.commit()

    # 10. Seed 1000+ Sensor Readings (Simulated historical telemetry)
    sensor_records = []
    for mine in created_mines:
        base_methane = 0.85 if mine.risk_level in ["CRITICAL", "HIGH"] else 0.35
        base_co = 18.0 if mine.risk_level in ["CRITICAL", "HIGH"] else 8.0
        base_dust = 110.0 if mine.risk_level in ["CRITICAL", "HIGH"] else 45.0

        for h in range(105): # 10 mines * 105 = 1050 readings
            ts = now - datetime.timedelta(hours=h)
            # Add occasional spike for realism
            spike = (random.random() < 0.08)
            meth = round(base_methane + random.uniform(0.05, 0.4) + (2.5 if spike else 0.0), 2)
            co = round(base_co + random.uniform(1.0, 8.0) + (45.0 if spike else 0.0), 1)
            dust = round(base_dust + random.uniform(5.0, 30.0) + (180.0 if spike else 0.0), 1)
            temp = round(26.0 + random.uniform(1.0, 7.0), 1)
            humidity = round(55.0 + random.uniform(2.0, 22.0), 1)
            noise = round(65.0 + random.uniform(2.0, 20.0), 1)
            aqi = round(70.0 + random.uniform(5.0, 40.0) + (120.0 if spike else 0.0), 1)
            ph = round(7.2 + random.uniform(-0.5, 0.5) - (1.6 if spike else 0.0), 2)

            is_anom = spike or meth > 2.0 or co > 50.0 or dust > 250.0
            rflag = "CRITICAL" if (meth > 2.0 or co > 50.0) else ("WARNING" if is_anom else "NORMAL")

            sr = SensorReading(
                mine_id=mine.id,
                zone=f"Shaft {random.choice(['1A', '2B', '3C', '4 - Deep Wall'])}",
                data_source="DEMO IoT STREAM",
                methane=meth,
                co=co,
                dust=dust,
                temperature=temp,
                humidity=humidity,
                noise=noise,
                air_quality=aqi,
                water_quality=ph,
                is_anomaly=is_anom,
                anomaly_score=-0.38 if is_anom else 0.22,
                risk_flag=rflag,
                timestamp=ts
            )
            sensor_records.append(sr)

    db.bulk_save_objects(sensor_records)
    db.commit()

    # 11. Seed Initial Audit Logs
    audit_events = [
        ("Login", "User", None, "User admin@coalguard.gov.in logged in from 10.0.4.12"),
        ("System Initialized", "System", None, "CoalGuard AI Enterprise Engine deployed for SIH 2026."),
        ("Compliance Rule Loaded", "Rule", None, "16 DGMS & MoEFCC statutory compliance rules synchronized."),
        ("Telemetry Stream Active", "Sensor", None, "Real-time Isolation Forest surveillance engaged across 10 coal blocks.")
    ]
    for action, entity, eid, details in audit_events:
        db.add(AuditLog(
            user_id=1,
            user_email="admin@coalguard.gov.in",
            action=action,
            entity=entity,
            entity_id=eid,
            details=details,
            ip_address="127.0.0.1"
        ))
    db.commit()

    print("CoalGuard AI database seeded successfully with 10 mines, 50+ compliance records, 30+ violations, 25+ inspections, 1000+ sensor readings, 50+ alerts.")
