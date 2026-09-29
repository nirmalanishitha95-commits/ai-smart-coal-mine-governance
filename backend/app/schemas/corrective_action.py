from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CorrectiveActionBase(BaseModel):
    violation_id: int
    mine_id: int
    description: str
    assigned_person: str
    priority: str = "MEDIUM"
    due_date: datetime

class CorrectiveActionCreate(CorrectiveActionBase):
    pass

class CorrectiveActionUpdate(BaseModel):
    status: Optional[str] = None
    assigned_person: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    evidence_url: Optional[str] = None
    completion_date: Optional[datetime] = None

class CorrectiveActionVerify(BaseModel):
    is_approved: bool
    verification_notes: str

class CorrectiveActionResponse(CorrectiveActionBase):
    id: int
    code: str
    mine_name: Optional[str] = None
    violation_code: Optional[str] = None
    status: str
    evidence_url: Optional[str] = None
    completion_date: Optional[datetime] = None
    verified_by_name: Optional[str] = None
    verification_notes: Optional[str] = None
    is_overdue: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
