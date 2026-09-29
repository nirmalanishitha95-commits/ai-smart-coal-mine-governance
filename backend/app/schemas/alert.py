from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AlertBase(BaseModel):
    mine_id: int
    alert_type: str
    severity: str
    message: str
    details: Optional[str] = None

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: str # READ, ACKNOWLEDGED, RESOLVED

class AlertResponse(AlertBase):
    id: int
    mine_name: Optional[str] = None
    mine_code: Optional[str] = None
    status: str
    acknowledged_by_name: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
