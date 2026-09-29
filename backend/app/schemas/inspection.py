from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class InspectionFindingCreate(BaseModel):
    question_text: str
    answer: str # YES, NO, NOT APPLICABLE
    finding_description: Optional[str] = None
    severity: Optional[str] = "LOW"
    evidence_url: Optional[str] = None
    generate_violation: Optional[bool] = False
    corrective_action_description: Optional[str] = None

class InspectionFindingResponse(BaseModel):
    id: int
    question_text: str
    answer: str
    finding_description: Optional[str] = None
    severity: str
    evidence_url: Optional[str] = None
    violation_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InspectionBase(BaseModel):
    mine_id: int
    inspector_id: Optional[int] = None
    inspection_type: str = "Routine"
    scheduled_date: datetime

class InspectionCreate(InspectionBase):
    pass

class InspectionComplete(BaseModel):
    summary: str
    recommendations: Optional[str] = None
    findings: List[InspectionFindingCreate]

class InspectionResponse(InspectionBase):
    id: int
    code: str
    mine_name: Optional[str] = None
    inspector_name: Optional[str] = None
    completed_date: Optional[datetime] = None
    status: str
    score: float
    summary: Optional[str] = None
    recommendations: Optional[str] = None
    findings_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InspectionDetailResponse(InspectionResponse):
    findings: List[InspectionFindingResponse] = []
