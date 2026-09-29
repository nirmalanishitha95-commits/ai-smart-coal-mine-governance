import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(100), nullable=False, index=True)
    # Types: Critical Sensor Anomaly, High Mine Risk, Compliance Violation, Overdue Corrective Action, Upcoming Inspection, Safety Incident
    severity = Column(String(20), default="MEDIUM", nullable=False, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(30), default="UNREAD", nullable=False, index=True) # UNREAD, READ, ACKNOWLEDGED, RESOLVED
    acknowledged_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    mine = relationship("Mine", back_populates="alerts")
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
