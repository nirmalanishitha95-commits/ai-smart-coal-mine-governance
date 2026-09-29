import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(120), nullable=True, index=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True) 
    # Login, Logout, Mine created, Mine updated, Violation created, Violation updated, Inspection created, Inspection completed, Corrective action updated, Compliance updated, Report generated, Alert acknowledged
    entity = Column(String(50), nullable=False, index=True) # Mine, Violation, Inspection, CorrectiveAction, User, Alert, Report
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", foreign_keys=[user_id])
