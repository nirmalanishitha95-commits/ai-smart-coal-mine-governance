from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- Auth & User Schemas -----------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role_name: str = "MINE_MANAGER"
    mine_id: Optional[int] = None
    designation: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role_name: str
    mine_id: Optional[int] = None
    mine_name: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# ----------------- Mine Schemas -----------------
class MineCreate(BaseModel):
    name: str
    code: str
    location: str
    district: str
    state: str
    mine_type: str = "Opencast"
    production_capacity: float = 1.5
    operational_status: str = "Active"
    latitude: float
    longitude: float

class MineUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    mine_type: Optional[str] = None
    production_capacity: Optional[float] = None
    operational_status: Optional[str] = None
    compliance_score: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class MineResponse(BaseModel):
    id: int
    name: str
    code: str
    location: str
    district: str
    state: str
    mine_type: str
    production_capacity: float
    operational_status: str
    compliance_score: float
    risk_score: float
    risk_level: str
    last_inspection: Optional[datetime] = None
    next_inspection: Optional[datetime] = None
    latitude: float
    longitude: float
    open_violations_count: Optional[int] = 0
    active_alerts_count: Optional[int] = 0

    class Config:
        from_attributes = True

class RiskFactor(BaseModel):
    factor: str
    impact: float
    description: Optional[str] = None

class MineRiskResponse(BaseModel):
    mine_id: int
    mine_name: str
    risk_score: float
    risk_level: str
    factors: List[RiskFactor]
    recommendations: List[str]
    last_evaluated: datetime

# ----------------- Compliance Schemas -----------------
class ComplianceRuleResponse(BaseModel):
    id: int
    rule_code: str
    rule_name: str
    category: str
    description: str
    penalty_points: int
    mandatory: bool

    class Config:
        from_attributes = True

class ComplianceRecordResponse(BaseModel):
    id: int
    mine_id: int
    mine_name: Optional[str] = None
    rule_id: int
    rule_code: Optional[str] = None
    rule_name: Optional[str] = None
    category: Optional[str] = None
    status: str
    score: float
    due_date: Optional[datetime] = None
    last_verified: Optional[datetime] = None
    evidence: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class ComplianceRecordUpdate(BaseModel):
    status: Optional[str] = None
    score: Optional[float] = None
    evidence: Optional[str] = None
    remarks: Optional[str] = None

# ----------------- Inspection Schemas -----------------
class ChecklistItemAnswer(BaseModel):
    checklist_item: str
    answer: str # YES, NO, NOT APPLICABLE
    finding_description: Optional[str] = None
    severity: Optional[str] = "LOW"
    evidence: Optional[str] = None
    corrective_action_required: Optional[bool] = False

class InspectionCreate(BaseModel):
    mine_id: int
    inspector_id: Optional[int] = None
    inspection_type: str = "Routine"
    scheduled_date: datetime
    overall_finding: Optional[str] = None
    recommendations: Optional[str] = None

class ChecklistSubmission(BaseModel):
    items: List[ChecklistItemAnswer]
    overall_finding: Optional[str] = None
    recommendations: Optional[str] = None
    status: str = "COMPLETED"

class InspectionFindingResponse(BaseModel):
    id: int
    checklist_item: str
    answer: str
    finding_description: Optional[str] = None
    severity: str
    evidence: Optional[str] = None
    corrective_action_required: bool

    class Config:
        from_attributes = True

class InspectionResponse(BaseModel):
    id: int
    mine_id: int
    mine_name: Optional[str] = None
    inspector_id: Optional[int] = None
    inspector_name: Optional[str] = None
    inspection_type: str
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    status: str
    overall_finding: Optional[str] = None
    recommendations: Optional[str] = None
    findings: List[InspectionFindingResponse] = []

    class Config:
        from_attributes = True

# ----------------- Violation Schemas -----------------
class ViolationCreate(BaseModel):
    mine_id: int
    inspection_id: Optional[int] = None
    category: str
    description: str
    severity: str = "MEDIUM"
    detected_by: Optional[str] = "Government Officer"
    due_date: Optional[datetime] = None
    assigned_officer: Optional[str] = None
    fine_amount: Optional[float] = 0.0

class ViolationUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_officer: Optional[str] = None
    due_date: Optional[datetime] = None
    fine_amount: Optional[float] = None
    description: Optional[str] = None

class ViolationResponse(BaseModel):
    id: int
    violation_code: str
    mine_id: int
    mine_name: Optional[str] = None
    inspection_id: Optional[int] = None
    category: str
    description: str
    severity: str
    detected_date: datetime
    detected_by: str
    status: str
    due_date: Optional[datetime] = None
    assigned_officer: Optional[str] = None
    fine_amount: float
    corrective_actions_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------- Corrective Action Schemas -----------------
class CorrectiveActionCreate(BaseModel):
    violation_id: int
    mine_id: int
    description: str
    assigned_person: str
    priority: str = "MEDIUM"
    due_date: datetime

class CorrectiveActionUpdate(BaseModel):
    status: Optional[str] = None
    evidence: Optional[str] = None
    officer_notes: Optional[str] = None
    completion_date: Optional[datetime] = None

class CorrectiveActionResponse(BaseModel):
    id: int
    action_code: Optional[str] = None
    violation_id: int
    violation_code: Optional[str] = None
    mine_id: int
    mine_name: Optional[str] = None
    description: str
    assigned_person: str
    priority: str
    due_date: datetime
    completion_date: Optional[datetime] = None
    status: str
    evidence: Optional[str] = None
    officer_notes: Optional[str] = None
    is_overdue: Optional[bool] = False

    class Config:
        from_attributes = True

# ----------------- Sensor & Environment Schemas -----------------
class SensorReadingCreate(BaseModel):
    mine_id: int
    zone: Optional[str] = "Shaft A - Section 3"
    methane: float
    co: float
    dust: float
    temperature: float
    humidity: float
    noise: float
    air_quality: float
    water_quality: float

class SensorReadingResponse(BaseModel):
    id: int
    mine_id: int
    mine_name: Optional[str] = None
    zone: str
    data_source: Optional[str] = "DEMO IoT STREAM"
    methane: float
    co: float
    dust: float
    temperature: float
    humidity: float
    noise: float
    air_quality: float
    water_quality: float
    is_anomaly: bool
    anomaly_score: float
    risk_flag: str
    timestamp: datetime

    class Config:
        from_attributes = True

class EnvironmentalReadingResponse(BaseModel):
    id: int
    mine_id: int
    mine_name: Optional[str] = None
    parameter_name: str
    value: float
    unit: str
    status: str
    threshold: float
    timestamp: datetime

    class Config:
        from_attributes = True

# ----------------- Alert Schemas -----------------
class AlertResponse(BaseModel):
    id: int
    mine_id: int
    mine_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    timestamp: datetime
    status: str
    acknowledged_by: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Dashboard & Analytics Schemas -----------------
class KPICard(BaseModel):
    title: str
    value: Any
    change: Optional[str] = None
    status: Optional[str] = None

class DashboardStatsResponse(BaseModel):
    total_mines: int
    compliant_mines: int
    non_compliant_mines: int
    high_risk_mines: int
    critical_alerts: int
    open_violations: int
    pending_corrective_actions: int
    upcoming_inspections: int
    compliance_trend: List[dict]
    risk_distribution: List[dict]
    violations_by_category: List[dict]
    environmental_trends: List[dict]
    inspection_status: List[dict]
    corrective_action_status: List[dict]
    recent_alerts: List[AlertResponse]

class AnalyticsResponse(BaseModel):
    date_range: str
    compliance_trend: List[dict]
    risk_trend: List[dict]
    violation_trend: List[dict]
    environmental_anomaly_trend: List[dict]
    inspection_completion: List[dict]
    corrective_action_completion: List[dict]
    incident_trend: List[dict]

# ----------------- Audit Schemas -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: str
    action: str
    entity: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True

# ----------------- Simulation Schemas -----------------
class SimulationStep(BaseModel):
    step_number: int
    title: str
    description: str
    status: str # SUCCESS, PENDING, IN_PROGRESS
    details: dict

class SimulationRunResponse(BaseModel):
    simulation_id: str
    mine_id: int
    mine_name: str
    executed_at: datetime
    steps: List[SimulationStep]
    final_status: str
    summary: str
