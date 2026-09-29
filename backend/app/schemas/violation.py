from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ViolationBase(BaseModel):
    mine_id: int
    category: str
    description: str
    severity: str = "MEDIUM"
    due_date: Optional[datetime] = None
    fine_amount: Optional[float] = 0.0
    assigned_officer_id: Optional[int] = None
    inspection_id: Optional[int] = None

class ViolationCreate(ViolationBase):
    pass

class ViolationUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_officer_id: Optional[int] = None
    fine_amount: Optional[float] = None
    resolved_date: Optional[datetime] = None

class ViolationResponse(ViolationBase):
    id: int
    code: str
    mine_name: Optional[str] = None
    mine_code: Optional[str] = None
    detected_date: datetime
    detected_by_name: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    status: str
    resolved_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
