import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Mine(Base):
    __tablename__ = "mines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    mine_type = Column(String(50), nullable=False, default="Open-cast")  # Open-cast, Underground, Mixed
    production_capacity_mt = Column(Float, default=1.0)
    operational_status = Column(String(50), default="Operational")  # Operational, Maintenance, Temporarily Closed, Under Review
    
    compliance_score = Column(Float, default=85.0)  # 0 to 100
    risk_score = Column(Float, default=25.0)        # 0 to 100
    risk_level = Column(String(20), default="LOW")   # LOW, MEDIUM, HIGH, CRITICAL
    
    last_inspection_date = Column(DateTime, nullable=True)
    next_inspection_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    location = relationship("MineLocation", back_populates="mine", uselist=False, cascade="all, delete-orphan")
    compliance_records = relationship("ComplianceRecord", back_populates="mine", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="mine", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="mine", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="mine", cascade="all, delete-orphan")
    environmental_readings = relationship("EnvironmentalReading", back_populates="mine", cascade="all, delete-orphan")
    safety_incidents = relationship("SafetyIncident", back_populates="mine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="mine", cascade="all, delete-orphan")

class MineLocation(Base):
    __tablename__ = "mine_locations"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), unique=True, nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_hectares = Column(Float, default=150.0)
    elevation_m = Column(Float, default=250.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="location")
