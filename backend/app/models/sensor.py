import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_type = Column(String(50), nullable=False, index=True) 
    # METHANE, CO, DUST, TEMPERATURE, HUMIDITY, NOISE, AIR_QUALITY, WATER_QUALITY
    sensor_code = Column(String(50), nullable=True)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    status = Column(String(20), default="NORMAL", nullable=False) # NORMAL, WARNING, CRITICAL, ANOMALY
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_score = Column(Float, default=0.0) # -1.0 to 1.0 (Isolation Forest or deviation)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    mine = relationship("Mine", back_populates="sensor_readings")

class EnvironmentalReading(Base):
    __tablename__ = "environmental_readings"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    methane_pct = Column(Float, nullable=False) # % (Threshold ~1.0-1.25%)
    co_ppm = Column(Float, nullable=False)      # ppm (Threshold ~50 ppm)
    dust_pm10 = Column(Float, nullable=False)   # ug/m3 (Threshold ~100 ug/m3)
    temperature_c = Column(Float, nullable=False) # °C (Threshold ~35°C)
    humidity_pct = Column(Float, nullable=False)  # %
    noise_db = Column(Float, nullable=False)     # dB (Threshold ~85 dB)
    air_quality_aqi = Column(Float, nullable=False) # AQI index
    water_ph = Column(Float, nullable=False)     # pH (6.5 - 8.5)
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_reason = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    mine = relationship("Mine", back_populates="environmental_readings")

class SafetyIncident(Base):
    __tablename__ = "safety_incidents"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    incident_type = Column(String(100), nullable=False) 
    # Gas Leakage, Slope Instability, Equipment Hazard, Ventilation Failure, Dust Surge, Fire Hazard
    severity = Column(String(20), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    occurred_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    reported_by = Column(String(100), nullable=True)
    casualties = Column(Integer, default=0)
    status = Column(String(50), default="REPORTED") # REPORTED, INVESTIGATING, MITIGATED, CLOSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="safety_incidents")
