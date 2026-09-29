import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id", ondelete="CASCADE"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    assigned_person = Column(String(100), nullable=False)
    priority = Column(String(20), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False, index=True)
    # PENDING, IN PROGRESS, SUBMITTED, VERIFICATION, COMPLETED, OVERDUE
    evidence_url = Column(String(255), nullable=True)
    completion_date = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    violation = relationship("Violation", back_populates="corrective_actions")
    mine = relationship("Mine")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
