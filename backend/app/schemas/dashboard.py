from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class DashboardKPIs(BaseModel):
    total_mines: int
    compliant_mines: int
    non_compliant_mines: int
    high_risk_mines: int
    critical_alerts: int
    open_violations: int
    pending_corrective_actions: int
    upcoming_inspections: int

class ChartDataPoint(BaseModel):
    name: str
    value: float
    secondary_value: Optional[float] = None
    color: Optional[str] = None

class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    compliance_trend: List[Dict[str, Any]]
    risk_distribution: List[Dict[str, Any]]
    violations_by_category: List[Dict[str, Any]]
    environmental_trends: List[Dict[str, Any]]
    inspection_status: List[Dict[str, Any]]
    corrective_action_status: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    timestamp: str

class AnalyticsResponse(BaseModel):
    timeframe: str
    compliance_trend: List[Dict[str, Any]]
    risk_trend: List[Dict[str, Any]]
    violation_trend: List[Dict[str, Any]]
    environmental_anomaly_trend: List[Dict[str, Any]]
    inspection_completion: List[Dict[str, Any]]
    corrective_action_completion: List[Dict[str, Any]]
    incident_trend: List[Dict[str, Any]]
