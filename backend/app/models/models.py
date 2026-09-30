import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    designation = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    role = relationship("Role", back_populates="users")
    mine = relationship("Mine", back_populates="assigned_staff")


class Mine(Base):
    __tablename__ = "mines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    location = Column(String(200), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    mine_type = Column(String(50), default="Opencast") # Opencast, Underground, Mixed
    production_capacity = Column(Float, default=1.5) # Million Metric Tonnes Per Annum (MTPA)
    operational_status = Column(String(50), default="Active") # Active, Under Review, Suspended, Maintenance
    compliance_score = Column(Float, default=85.0) # 0-100
    risk_score = Column(Float, default=24.0) # 0-100
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    last_inspection = Column(DateTime, nullable=True)
    next_inspection = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Authoritative Public Government Data Provenance
    source_name = Column(String(150), default="Coal Directory of India / Ministry of Coal")
    source_url = Column(String(255), default="https://coal.gov.in")
    source_date = Column(String(50), default="2022-23")
    data_type = Column(String(50), default="Historical Government Data")
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    assigned_staff = relationship("User", back_populates="mine")
    locations = relationship("MineLocation", back_populates="mine", cascade="all, delete-orphan")
    compliance_records = relationship("ComplianceRecord", back_populates="mine", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="mine", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="mine", cascade="all, delete-orphan")
    corrective_actions = relationship("CorrectiveAction", back_populates="mine", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="mine", cascade="all, delete-orphan")
    environmental_readings = relationship("EnvironmentalReading", back_populates="mine", cascade="all, delete-orphan")
    safety_incidents = relationship("SafetyIncident", back_populates="mine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="mine", cascade="all, delete-orphan")
    production_records = relationship("ProductionRecord", back_populates="mine", cascade="all, delete-orphan")
    accident_records = relationship("AccidentRecord", back_populates="mine", cascade="all, delete-orphan")
    safety_records = relationship("SafetyRecord", back_populates="mine", cascade="all, delete-orphan")



class MineLocation(Base):
    __tablename__ = "mine_locations"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    zone_name = Column(String(100), nullable=False)
    coordinates = Column(String(100), nullable=True)
    hazard_level = Column(String(30), default="Standard")
    created_at = Column(DateTime, default=utc_now)

    mine = relationship("Mine", back_populates="locations")


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)
    rule_name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False, index=True) # Safety, Environmental, Equipment, Labour, Documentation, Emergency preparedness, Operational compliance
    description = Column(Text, nullable=False)
    penalty_points = Column(Integer, default=10)
    mandatory = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    records = relationship("ComplianceRecord", back_populates="rule")


class ComplianceRecord(Base):
    __tablename__ = "compliance_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("compliance_rules.id"), nullable=False)
    status = Column(String(50), default="COMPLIANT") # COMPLIANT, PARTIALLY COMPLIANT, NON-COMPLIANT, PENDING REVIEW
    score = Column(Float, default=100.0)
    due_date = Column(DateTime, nullable=True)
    last_verified = Column(DateTime, default=utc_now)
    evidence = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    mine = relationship("Mine", back_populates="compliance_records")
    rule = relationship("ComplianceRule", back_populates="records")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    inspection_type = Column(String(50), default="Routine") # Routine, Safety, Environmental, Special, Follow-up
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, IN PROGRESS, COMPLETED, CANCELLED
    overall_finding = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    mine = relationship("Mine", back_populates="inspections")
    inspector = relationship("User")
    findings = relationship("InspectionFinding", back_populates="inspection", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="inspection")


class InspectionFinding(Base):
    __tablename__ = "inspection_findings"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    checklist_item = Column(String(255), nullable=False)
    answer = Column(String(20), nullable=False) # YES, NO, NOT APPLICABLE
    finding_description = Column(Text, nullable=True)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    evidence = Column(String(255), nullable=True)
    corrective_action_required = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    inspection = relationship("Inspection", back_populates="findings")


class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    violation_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    detected_date = Column(DateTime, default=utc_now)
    detected_by = Column(String(100), default="AI Surveillance Engine")
    status = Column(String(50), default="OPEN") # OPEN, UNDER REVIEW, CORRECTIVE ACTION, RESOLVED, CLOSED
    due_date = Column(DateTime, nullable=True)
    assigned_officer = Column(String(100), nullable=True)
    fine_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    mine = relationship("Mine", back_populates="violations")
    inspection = relationship("Inspection", back_populates="violations")
    corrective_actions = relationship("CorrectiveAction", back_populates="violation", cascade="all, delete-orphan")


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_code = Column(String(50), unique=True, index=True, nullable=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    description = Column(Text, nullable=False)
    assigned_person = Column(String(100), nullable=False)
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    due_date = Column(DateTime, nullable=False)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, IN PROGRESS, SUBMITTED, VERIFICATION, COMPLETED, OVERDUE
    evidence = Column(String(255), nullable=True)
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    violation = relationship("Violation", back_populates="corrective_actions")
    mine = relationship("Mine", back_populates="corrective_actions")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    zone = Column(String(100), default="Shaft A - Section 3")
    data_source = Column(String(50), default="DEMO IoT STREAM")
    methane = Column(Float, nullable=False) # % (Normal < 1.0%, Warning 1.0-2.0%, Critical > 2.0%)
    co = Column(Float, nullable=False) # ppm (Normal < 25, Warning 25-50, Critical > 50)
    dust = Column(Float, nullable=False) # mg/m3 or ug/m3
    temperature = Column(Float, nullable=False) # Celsius
    humidity = Column(Float, nullable=False) # %
    noise = Column(Float, nullable=False) # dB
    air_quality = Column(Float, nullable=False) # AQI index
    water_quality = Column(Float, nullable=False) # pH
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_score = Column(Float, default=0.0) # Isolation forest score (-1 to 1)
    risk_flag = Column(String(30), default="NORMAL") # NORMAL, WARNING, CRITICAL, ANOMALY
    timestamp = Column(DateTime, default=utc_now, index=True)

    mine = relationship("Mine", back_populates="sensor_readings")


class EnvironmentalReading(Base):
    __tablename__ = "environmental_readings"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    data_source = Column(String(50), default="DEMO IoT STREAM") # "DEMO IoT STREAM" or "Historical Government Data"
    parameter_name = Column(String(100), nullable=False) # Methane, CO, Dust, Temperature, Humidity, Air Quality, Water Quality
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False) # %, ppm, ug/m3, C, %, AQI, pH
    status = Column(String(30), default="NORMAL") # NORMAL, WARNING, CRITICAL, ANOMALY
    threshold = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)

    mine = relationship("Mine", back_populates="environmental_readings")


class SafetyIncident(Base):
    __tablename__ = "safety_incidents"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    incident_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    incident_date = Column(DateTime, default=utc_now)
    status = Column(String(50), default="INVESTIGATING")
    casualties = Column(Integer, default=0)
    injuries = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    mine = relationship("Mine", back_populates="safety_incidents")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    alert_type = Column(String(100), nullable=False) # Critical Sensor Anomaly, High Mine Risk, Compliance Violation, Overdue Corrective Action, Upcoming Inspection, Safety Incident
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)
    status = Column(String(30), default="UNREAD") # UNREAD, READ, ACKNOWLEDGED, RESOLVED
    acknowledged_by = Column(String(100), nullable=True)

    mine = relationship("Mine", back_populates="alerts")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=utc_now)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False) # inspection, violation, corrective_action, compliance
    entity_id = Column(Integer, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # PDF, JPG, PNG, DOCX
    file_size = Column(Integer, default=0) # bytes
    uploaded_by = Column(String(100), default="System")
    created_at = Column(DateTime, default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(120), nullable=False)
    action = Column(String(100), nullable=False) # Login, Logout, Mine created, Mine updated, Violation created, etc.
    entity = Column(String(50), nullable=False) # User, Mine, Violation, Inspection, CorrectiveAction, Compliance, Report, Alert
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=utc_now, index=True)


# ===================================================================
# AUTHORITATIVE PUBLIC GOVERNMENT DATASET MODELS
# Provenance: Ministry of Coal, DGMS, Coal Directory of India, CCO
# ===================================================================

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    source_organization = Column(String(200), nullable=False)
    source_url = Column(String(500), nullable=False)
    source_date = Column(String(50), nullable=False)
    data_type = Column(String(50), default="Historical Government Data") # "Historical Government Data" or "DEMO IoT STREAM" or "LIVE IoT DATA"
    record_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    last_imported = Column(DateTime, default=utc_now)


class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    company_name = Column(String(100), nullable=False) # CIL, SECL, BCCL, MCL, NCL, WCL, ECL, SCCL
    colliery_name = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False)
    fiscal_year = Column(String(50), nullable=False) # 2022-23, 2023-24
    coking_coal_mt = Column(Float, default=0.0) # Million Tonnes
    non_coking_coal_mt = Column(Float, default=0.0) # Million Tonnes
    total_production_mt = Column(Float, nullable=False)
    offtake_despatch_mt = Column(Float, nullable=False)
    source_name = Column(String(150), default="Provisional Coal Statistics / Ministry of Coal")
    source_url = Column(String(255), default="https://coal.gov.in")
    source_date = Column(String(50), default="2022-23")
    data_type = Column(String(50), default="Historical Government Data")
    created_at = Column(DateTime, default=utc_now)

    mine = relationship("Mine", back_populates="production_records")


class AccidentRecord(Base):
    __tablename__ = "accident_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    year = Column(Integer, nullable=False) # 2019, 2020, 2021, 2022, 2023
    company_name = Column(String(100), nullable=False)
    colliery_name = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False)
    accident_type = Column(String(150), nullable=False) # Fall of Roof, HEMM / Machinery, Inundation / Gas, Explosives
    fatalities = Column(Integer, default=0)
    serious_injuries = Column(Integer, default=0)
    cause_classification = Column(Text, nullable=True)
    source_name = Column(String(150), default="DGMS Annual Safety & Fatal Accident Statistics")
    source_url = Column(String(255), default="https://dgms.gov.in")
    source_date = Column(String(50), default="2022")
    data_type = Column(String(50), default="Historical Government Data")
    created_at = Column(DateTime, default=utc_now)

    mine = relationship("Mine", back_populates="accident_records")


class SafetyRecord(Base):
    __tablename__ = "safety_records"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    year = Column(Integer, nullable=False)
    state = Column(String(100), nullable=False)
    fatality_rate_per_mt = Column(Float, default=0.20) # per Million Tonnes
    serious_injury_rate_per_mt = Column(Float, default=0.45)
    fatality_rate_per_1000_workers = Column(Float, default=0.18)
    serious_injury_rate_per_1000_workers = Column(Float, default=0.42)
    source_name = Column(String(150), default="DGMS Standard Mining Safety Indicators")
    source_url = Column(String(255), default="https://dgms.gov.in")
    source_date = Column(String(50), default="2022")
    data_type = Column(String(50), default="Historical Government Data")
    created_at = Column(DateTime, default=utc_now)

    mine = relationship("Mine", back_populates="safety_records")

