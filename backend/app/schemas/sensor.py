from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class SensorReadingBase(BaseModel):
    mine_id: int
    sensor_type: str
    value: float
    unit: str
    sensor_code: Optional[str] = None

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: int
    status: str
    is_anomaly: bool
    anomaly_score: float
    recorded_at: datetime
    mine_name: Optional[str] = None

    class Config:
        from_attributes = True

class EnvironmentalReadingBase(BaseModel):
    mine_id: int
    methane_pct: float
    co_ppm: float
    dust_pm10: float
    temperature_c: float
    humidity_pct: float
    noise_db: float
    air_quality_aqi: float
    water_ph: float

class EnvironmentalReadingCreate(EnvironmentalReadingBase):
    pass

class EnvironmentalReadingResponse(EnvironmentalReadingBase):
    id: int
    is_anomaly: bool
    anomaly_reason: Optional[str] = None
    status: Optional[str] = "NORMAL"
    timestamp: datetime
    mine_name: Optional[str] = None

    class Config:
        from_attributes = True

class SafetyIncidentBase(BaseModel):
    mine_id: int
    incident_type: str
    severity: str = "MEDIUM"
    description: str
    reported_by: Optional[str] = None
    casualties: int = 0

class SafetyIncidentCreate(SafetyIncidentBase):
    pass

class SafetyIncidentResponse(SafetyIncidentBase):
    id: int
    code: str
    occurred_at: datetime
    status: str
    mine_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
