from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ComplianceRuleResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    description: str
    regulation_ref: Optional[str] = None
    penalty_amount: float
    created_at: datetime

    class Config:
        from_attributes = True

class ComplianceRecordBase(BaseModel):
    rule_id: int
    mine_id: int
    status: str = "PENDING REVIEW"
    score: float = 100.0
    due_date: Optional[datetime] = None
    evidence_url: Optional[str] = None
    notes: Optional[str] = None

class ComplianceRecordCreate(ComplianceRecordBase):
    pass

class ComplianceRecordUpdate(BaseModel):
    status: Optional[str] = None
    score: Optional[float] = None
    due_date: Optional[datetime] = None
    evidence_url: Optional[str] = None
    notes: Optional[str] = None

class ComplianceRecordResponse(ComplianceRecordBase):
    id: int
    rule: Optional[ComplianceRuleResponse] = None
    mine_name: Optional[str] = None
    mine_code: Optional[str] = None
    last_verified: Optional[datetime] = None
    verified_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
