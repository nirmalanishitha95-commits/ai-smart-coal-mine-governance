import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    # Safety, Environmental, Equipment, Labour, Operational
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False, index=True)
    # LOW, MEDIUM, HIGH, CRITICAL
    detected_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    detected_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="OPEN", nullable=False, index=True)
    # OPEN, UNDER REVIEW, CORRECTIVE ACTION, RESOLVED, CLOSED
    due_date = Column(DateTime, nullable=True)
    fine_amount = Column(Float, default=0.0)
    resolved_date = Column(DateTime, nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="violations")
    detected_by = relationship("User", foreign_keys=[detected_by_id])
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    corrective_actions = relationship("CorrectiveAction", back_populates="violation", cascade="all, delete-orphan")
