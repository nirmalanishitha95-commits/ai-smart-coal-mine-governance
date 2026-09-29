import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True) 
    # Categories: Safety, Environmental, Equipment, Labour, Documentation, Emergency Preparedness, Operational
    description = Column(Text, nullable=False)
    regulation_ref = Column(String(150), nullable=True) # e.g. Mines Act 1952 Sec 22
    penalty_amount = Column(Float, default=50000.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    records = relationship("ComplianceRecord", back_populates="rule", cascade="all, delete-orphan")

class ComplianceRecord(Base):
    __tablename__ = "compliance_records"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("compliance_rules.id", ondelete="CASCADE"), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING REVIEW", nullable=False, index=True)
    # COMPLIANT, PARTIALLY COMPLIANT, NON-COMPLIANT, PENDING REVIEW
    score = Column(Float, default=100.0)
    due_date = Column(DateTime, nullable=True)
    last_verified = Column(DateTime, nullable=True)
    evidence_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    rule = relationship("ComplianceRule", back_populates="records")
    mine = relationship("Mine", back_populates="compliance_records")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
