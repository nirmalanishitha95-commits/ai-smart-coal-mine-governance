from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class MineLocationBase(BaseModel):
    state: str
    district: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    area_hectares: Optional[float] = 150.0
    elevation_m: Optional[float] = 250.0

class MineLocationResponse(MineLocationBase):
    id: int
    mine_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class MineBase(BaseModel):
    code: str
    name: str
    mine_type: str = "Open-cast"
    production_capacity_mt: float = 1.0
    operational_status: str = "Operational"

class MineCreate(MineBase):
    state: str
    district: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    area_hectares: Optional[float] = 150.0

class MineUpdate(BaseModel):
    name: Optional[str] = None
    mine_type: Optional[str] = None
    production_capacity_mt: Optional[float] = None
    operational_status: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class MineResponse(MineBase):
    id: int
    compliance_score: float
    risk_score: float
    risk_level: str
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None
    location: Optional[MineLocationResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MineRiskFactor(BaseModel):
    factor: str
    impact: int
    detail: Optional[str] = None

class MineRiskResponse(BaseModel):
    mine_id: int
    mine_code: str
    mine_name: str
    risk_score: float
    risk_level: str
    factors: List[MineRiskFactor]
    assessment_timestamp: str
    disclaimer: str
