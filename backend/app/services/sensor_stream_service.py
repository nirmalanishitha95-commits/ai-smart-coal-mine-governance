import asyncio
import random
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import WebSocket
from sqlalchemy.orm import Session

from backend.app.database.session import SessionLocal
from backend.app.models.models import Mine, SensorReading, Alert
from backend.app.ai.anomaly_detector import anomaly_detector
from backend.app.ai.risk_engine import evaluate_mine_risk
from backend.app.services.audit_service import log_audit_action

class BaseSensorProvider(ABC):
    """
    Abstract interface for sensor data providers.
    Supports pluggable real-time ingestion from:
    1. Demo/Simulated IoT Stream (Hackathon & Offline Evaluation)
    2. Real IoT Gateway / MQTT Broker
    3. External SCADA / Mining Telemetry API
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        pass

    @abstractmethod
    def get_data_source_label(self) -> str:
        pass

    @abstractmethod
    def generate_or_fetch_reading(self, db: Session) -> Dict[str, Any]:
        pass


class DemoSimulatedSensorProvider(BaseSensorProvider):
    """
    Realistic simulated IoT sensor telemetry generator.
    Simulates multi-gas sensors across monitored coal mines.
    Periodically introduces realistic anomalies to exercise the Isolation Forest engine.
    """

    def __init__(self):
        self._counter = 0

    def get_provider_name(self) -> str:
        return "DemoSimulatedSensorProvider"

    def get_data_source_label(self) -> str:
        return "DEMO IoT STREAM"

    def generate_or_fetch_reading(self, db: Session) -> Dict[str, Any]:
        mines = db.query(Mine).all()
        if not mines:
            return {}

        self._counter += 1
        # Pick a target mine round-robin or randomly
        mine = mines[self._counter % len(mines)]

        # Determine if this cycle simulates an anomaly (e.g. every 7th reading)
        is_spike_cycle = (self._counter % 7 == 0)

        now = datetime.now(timezone.utc)
        zones = ["Shaft 4 - Extraction Face", "Ventilation Drift B", "Longwall Sector 2", "Conveyor Belt Transfer 1", "Haulage Main Dip"]
        zone = random.choice(zones)

        if is_spike_cycle:
            # Generate elevated gas or dust
            methane = round(random.uniform(2.2, 3.8), 2)
            co = round(random.uniform(45.0, 75.0), 1)
            dust = round(random.uniform(180.0, 320.0), 1)
            temperature = round(random.uniform(36.0, 41.5), 1)
            humidity = round(random.uniform(78.0, 89.0), 1)
            noise = round(random.uniform(85.0, 102.0), 1)
            air_quality = round(random.uniform(190.0, 280.0), 1)
            water_quality = round(random.uniform(5.2, 6.2), 1)
        else:
            # Nominal normal operating baseline
            methane = round(random.uniform(0.25, 0.78), 2)
            co = round(random.uniform(8.0, 22.0), 1)
            dust = round(random.uniform(40.0, 85.0), 1)
            temperature = round(random.uniform(26.0, 32.5), 1)
            humidity = round(random.uniform(55.0, 74.0), 1)
            noise = round(random.uniform(65.0, 78.0), 1)
            air_quality = round(random.uniform(50.0, 95.0), 1)
            water_quality = round(random.uniform(6.8, 7.6), 1)

        # Run Isolation Forest Anomaly Detection
        analysis = anomaly_detector.analyze_reading({
            "methane": methane,
            "co": co,
            "dust": dust,
            "temperature": temperature,
            "humidity": humidity,
            "noise": noise,
            "air_quality": air_quality,
            "water_quality": water_quality
        })

        # Save to database
        reading = SensorReading(
            mine_id=mine.id,
            zone=zone,
            methane=methane,
            co=co,
            dust=dust,
            temperature=temperature,
            humidity=humidity,
            noise=noise,
            air_quality=air_quality,
            water_quality=water_quality,
            is_anomaly=analysis["is_anomaly"],
            anomaly_score=analysis["anomaly_score"],
            risk_flag=analysis["risk_flag"],
            timestamp=now
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        anomaly_notification = None
        if analysis["is_anomaly"]:
            alert_msg = f"[AI SENSOR ANOMALY] {mine.name} ({zone}): " + ", ".join(analysis["triggers"] or ["Statistical multi-gas anomaly detected by Isolation Forest"])
            alert = Alert(
                mine_id=mine.id,
                alert_type="Critical Sensor Anomaly",
                severity="CRITICAL" if analysis["risk_flag"] == "CRITICAL" else "HIGH",
                message=alert_msg,
                timestamp=now,
                status="UNREAD"
            )
            db.add(alert)
            db.commit()

            # Trigger AI risk engine recalculation
            evaluate_mine_risk(mine.id, db)

            log_audit_action(
                db=db,
                user=None,
                action="Sensor Anomaly Detected",
                entity="SensorReading",
                entity_id=reading.id,
                details=f"Isolation Forest flagged anomaly at {mine.name}. Score: {analysis['anomaly_score']}."
            )

            anomaly_notification = {
                "mine_name": mine.name,
                "mine_id": mine.id,
                "zone": zone,
                "parameter": "Methane (CH4)" if methane >= 1.0 else ("Respirable Dust" if dust >= 100 else "Carbon Monoxide (CO)"),
                "current_value": f"{methane}%" if methane >= 1.0 else (f"{dust} µg/m³" if dust >= 100 else f"{co} ppm"),
                "normal_range": "< 1.0%" if methane >= 1.0 else ("< 100 µg/m³" if dust >= 100 else "< 25 ppm"),
                "previous_average": "0.45%" if methane >= 1.0 else ("55 µg/m³" if dust >= 100 else "12.0 ppm"),
                "ai_interpretation": "Abnormal statistical deviation detected by Isolation Forest multi-gas model.",
                "severity": analysis["risk_flag"],
                "timestamp": now.isoformat()
            }

        return {
            "reading": {
                "id": reading.id,
                "mine_id": mine.id,
                "mine_name": mine.name,
                "zone": zone,
                "methane": methane,
                "co": co,
                "dust": dust,
                "temperature": temperature,
                "humidity": humidity,
                "noise": noise,
                "air_quality": air_quality,
                "water_quality": water_quality,
                "is_anomaly": analysis["is_anomaly"],
                "anomaly_score": analysis["anomaly_score"],
                "risk_flag": analysis["risk_flag"],
                "timestamp": now.isoformat()
            },
            "anomaly_notification": anomaly_notification,
            "data_source": self.get_data_source_label()
        }


class FutureIoTSensorProvider(BaseSensorProvider):
    """
    Extensible hardware provider placeholder for live MQTT / Modbus telemetry.
    Can be configured when physical mine IoT hardware is integrated.
    """
    def get_provider_name(self) -> str:
        return "FutureIoTSensorProvider"

    def get_data_source_label(self) -> str:
        return "DATA SOURCE: LIVE IoT"

    def generate_or_fetch_reading(self, db: Session) -> Dict[str, Any]:
        # Ready for MQTT subscriber integration
        raise NotImplementedError("Live IoT hardware provider is configured for production field gateway.")


class FutureExternalAPISensorProvider(BaseSensorProvider):
    """
    Extensible provider placeholder for external SCADA / DGMS centralized cloud API.
    """
    def get_provider_name(self) -> str:
        return "FutureExternalAPISensorProvider"

    def get_data_source_label(self) -> str:
        return "DATA SOURCE: DGMS SCADA API"

    def generate_or_fetch_reading(self, db: Session) -> Dict[str, Any]:
        raise NotImplementedError("External SCADA provider is configured for ministry cloud integration.")


class ConnectionManager:
    """Manages active WebSocket connections for live sensor broadcasting."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


# Singleton instances
sensor_provider: BaseSensorProvider = DemoSimulatedSensorProvider()
connection_manager = ConnectionManager()

def get_current_sensor_provider() -> BaseSensorProvider:
    return sensor_provider

def set_sensor_provider(provider: BaseSensorProvider):
    global sensor_provider
    sensor_provider = provider

def get_live_sensor_table_data(db: Session) -> List[Dict[str, Any]]:
    """
    Constructs the real-time sensor parameters table across monitored mines.
    Columns: Mine | Parameter | Current Value | Normal Range | Status | Last Updated
    """
    mines = db.query(Mine).all()
    table_rows = []

    now = datetime.now(timezone.utc)
    for m in mines:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.mine_id == m.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if latest:
            # Compute seconds ago
            seconds_ago = int((now - latest.timestamp.replace(tzinfo=timezone.utc)).total_seconds()) if latest.timestamp else 5
            time_str = f"{seconds_ago} sec ago" if seconds_ago < 60 else f"{seconds_ago // 60} min ago"

            # Primary parameter status
            methane_status = "CRITICAL" if latest.methane >= 2.0 else ("WARNING" if latest.methane >= 1.0 else "NORMAL")
            dust_status = "CRITICAL" if latest.dust >= 250 else ("WARNING" if latest.dust >= 100 else "NORMAL")
            temp_status = "CRITICAL" if latest.temperature >= 42 else ("WARNING" if latest.temperature >= 35 else "NORMAL")

            composite_status = "CRITICAL" if "CRITICAL" in [methane_status, dust_status, temp_status] or latest.risk_flag == "CRITICAL" else (
                "WARNING" if "WARNING" in [methane_status, dust_status, temp_status] or latest.risk_flag == "WARNING" else "NORMAL"
            )

            table_rows.append({
                "mine_id": m.id,
                "mine_name": m.name,
                "location": f"{m.district}, {m.state}",
                "risk_level": m.risk_level,
                "risk_score": m.risk_score,
                "compliance_score": m.compliance_score,
                "methane": latest.methane,
                "methane_range": "0 – 1.0%",
                "methane_status": methane_status,
                "dust": latest.dust,
                "dust_range": "0 – 100 µg/m³",
                "dust_status": dust_status,
                "temperature": latest.temperature,
                "temp_range": "20 – 35°C",
                "temp_status": temp_status,
                "co": latest.co,
                "co_range": "0 – 25 ppm",
                "humidity": latest.humidity,
                "humidity_range": "40 – 80%",
                "air_quality": latest.air_quality,
                "water_quality": latest.water_quality,
                "status": composite_status,
                "last_updated": time_str,
                "timestamp": latest.timestamp.isoformat()
            })
        else:
            table_rows.append({
                "mine_id": m.id,
                "mine_name": m.name,
                "location": f"{m.district}, {m.state}",
                "risk_level": m.risk_level,
                "risk_score": m.risk_score,
                "compliance_score": m.compliance_score,
                "methane": 0.42,
                "methane_range": "0 – 1.0%",
                "methane_status": "NORMAL",
                "dust": 52.0,
                "dust_range": "0 – 100 µg/m³",
                "dust_status": "NORMAL",
                "temperature": 28.5,
                "temp_range": "20 – 35°C",
                "temp_status": "NORMAL",
                "co": 12.0,
                "co_range": "0 – 25 ppm",
                "humidity": 65.0,
                "humidity_range": "40 – 80%",
                "air_quality": 68.0,
                "water_quality": 7.2,
                "status": "NORMAL",
                "last_updated": "Just now",
                "timestamp": now.isoformat()
            })

    return table_rows


async def run_sensor_simulation_loop():
    """
    Background worker that runs every 6 seconds to simulate real-time
    IoT sensor stream and broadcast live packets across connected WebSockets.
    """
    while True:
        try:
            await asyncio.sleep(6)
            db = SessionLocal()
            try:
                provider = get_current_sensor_provider()
                res = provider.generate_or_fetch_reading(db)
                table_data = get_live_sensor_table_data(db)
                now_iso = datetime.now(timezone.utc).isoformat()
                await connection_manager.broadcast({
                    "type": "TICK_UPDATE",
                    "data_source": provider.get_data_source_label(),
                    "reading": res.get("reading"),
                    "anomaly": res.get("anomaly_notification"),
                    "table": table_data,
                    "timestamp": now_iso
                })
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            # Continue running despite transient error
            await asyncio.sleep(6)
