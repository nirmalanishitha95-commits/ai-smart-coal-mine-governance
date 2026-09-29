import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    inspection_type = Column(String(50), default="Routine", nullable=False) # Routine, Safety, Environmental, Special, Follow-up
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="SCHEDULED", nullable=False, index=True) # SCHEDULED, IN PROGRESS, COMPLETED, CANCELLED
    score = Column(Float, default=100.0)
    summary = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])
    findings = relationship("InspectionFinding", back_populates="inspection", cascade="all, delete-orphan")

class InspectionFinding(Base):
    __tablename__ = "inspection_findings"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(String(255), nullable=False)
    answer = Column(String(20), nullable=False) # YES, NO, NOT APPLICABLE
    finding_description = Column(Text, nullable=True)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    evidence_url = Column(String(255), nullable=True)
    violation_id = Column(Integer, ForeignKey("violations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inspection = relationship("Inspection", back_populates="findings")
    violation = relationship("Violation")
