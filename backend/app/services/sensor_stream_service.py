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
            # Generate elevated hazard conditions
            methane = round(random.uniform(2.1, 3.8), 2)
            co = round(random.uniform(48.0, 78.0), 1)
            oxygen = round(random.uniform(16.5, 18.8), 1)
            co2 = round(random.uniform(0.9, 1.8), 2)
            dust = round(random.uniform(190.0, 320.0), 1)
            temperature = round(random.uniform(37.0, 42.5), 1)
            humidity = round(random.uniform(78.0, 89.0), 1)
            smoke = round(random.uniform(0.45, 0.85), 2)
            pressure = round(random.uniform(96.0, 99.5), 1)
            ventilation_flow = round(random.uniform(6.5, 9.8), 1)
            noise = round(random.uniform(85.0, 102.0), 1)
            air_quality = round(random.uniform(190.0, 280.0), 1)
            water_quality = round(random.uniform(5.2, 6.2), 1)
        else:
            # Nominal normal operating baseline
            methane = round(random.uniform(0.25, 0.75), 2)
            co = round(random.uniform(6.0, 18.0), 1)
            oxygen = round(random.uniform(20.5, 21.2), 1)
            co2 = round(random.uniform(0.04, 0.28), 2)
            dust = round(random.uniform(35.0, 75.0), 1)
            temperature = round(random.uniform(24.0, 29.5), 1)
            humidity = round(random.uniform(55.0, 70.0), 1)
            smoke = round(random.uniform(0.02, 0.12), 2)
            pressure = round(random.uniform(101.0, 103.5), 1)
            ventilation_flow = round(random.uniform(18.5, 24.0), 1)
            noise = round(random.uniform(65.0, 78.0), 1)
            air_quality = round(random.uniform(50.0, 85.0), 1)
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
            oxygen=oxygen,
            co2=co2,
            dust=dust,
            temperature=temperature,
            humidity=humidity,
            smoke=smoke,
            pressure=pressure,
            ventilation_flow=ventilation_flow,
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
            alert_msg = f"[UNDERGROUND HAZARD ALERT] {mine.name} ({zone}): " + ", ".join(analysis["triggers"] or ["Atmospheric multi-gas anomaly detected by Isolation Forest"])
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
                "parameter": "Methane (CH4)" if methane >= 1.0 else ("Oxygen (O2)" if oxygen < 19.5 else ("Ventilation Flow" if ventilation_flow < 10 else "Carbon Monoxide (CO)")),
                "current_value": f"{methane}%" if methane >= 1.0 else (f"{oxygen}%" if oxygen < 19.5 else (f"{ventilation_flow} m³/min" if ventilation_flow < 10 else f"{co} ppm")),
                "normal_range": "< 1.0%" if methane >= 1.0 else ("19.5 – 23.5%" if oxygen < 19.5 else ("> 15 m³/min" if ventilation_flow < 10 else "< 25 ppm")),
                "previous_average": "0.45%" if methane >= 1.0 else ("20.9%" if oxygen < 19.5 else ("21.5 m³/min" if ventilation_flow < 10 else "12.0 ppm")),
                "ai_interpretation": "Multi-gas underground safety condition breached. Isolation Forest outlier score: " + str(analysis["anomaly_score"]),
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
                "oxygen": oxygen,
                "co2": co2,
                "dust": dust,
                "temperature": temperature,
                "humidity": humidity,
                "smoke": smoke,
                "pressure": pressure,
                "ventilation_flow": ventilation_flow,
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
        return "LIVE IoT DATA"

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
    Constructs the real-time sensor parameters table across underground mines.
    Monitors: Methane, CO, Oxygen, CO2, Temp, Humidity, Dust, Smoke, Pressure, Ventilation.
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
            seconds_ago = int((now - latest.timestamp.replace(tzinfo=timezone.utc)).total_seconds()) if latest.timestamp else 5
            time_str = f"{seconds_ago}s ago" if seconds_ago < 60 else f"{seconds_ago // 60}m ago"

            # Threshold classifications
            # Methane: Normal (<1.0%) -> Warning (1.0-2.0%) -> Critical (>2.0%)
            m_val = latest.methane or 0.4
            methane_status = "CRITICAL" if m_val >= 2.0 else ("WARNING" if m_val >= 1.0 else "NORMAL")

            # CO: Normal (<25 ppm) -> Warning (25-50 ppm) -> Critical (>50 ppm)
            co_val = latest.co or 12.0
            co_status = "CRITICAL" if co_val >= 50.0 else ("WARNING" if co_val >= 25.0 else "NORMAL")

            # Oxygen: Safe (19.5-23.5%) -> Warning (18.0-19.5%) -> Critical (<18.0%)
            o2_val = latest.oxygen if latest.oxygen is not None else 20.9
            oxygen_status = "CRITICAL" if o2_val < 18.0 else ("WARNING" if o2_val < 19.5 else "SAFE")

            # Temperature: Normal (<30C) -> High (30-38C) -> Critical (>38C)
            temp_val = latest.temperature or 27.5
            temp_status = "CRITICAL" if temp_val >= 38.0 else ("HIGH" if temp_val >= 30.0 else "NORMAL")

            # Dust: Normal (<100 ug/m3) -> Elevated (100-200 ug/m3) -> Critical (>200 ug/m3)
            dust_val = latest.dust or 48.0
            dust_status = "CRITICAL" if dust_val >= 200.0 else ("ELEVATED" if dust_val >= 100.0 else "NORMAL")

            # Ventilation: Normal (>15 m3/min) -> Warning (10-15 m3/min) -> Failure (<10 m3/min)
            vent_val = latest.ventilation_flow if latest.ventilation_flow is not None else 21.0
            vent_status = "FAILURE" if vent_val < 10.0 else ("WARNING" if vent_val < 15.0 else "NORMAL")

            # Overall status
            if "CRITICAL" in [methane_status, co_status, oxygen_status, temp_status, dust_status] or vent_status == "FAILURE":
                composite_status = "CRITICAL"
            elif "WARNING" in [methane_status, co_status, oxygen_status, vent_status] or "HIGH" in [temp_status] or "ELEVATED" in [dust_status]:
                composite_status = "WARNING"
            else:
                composite_status = "NORMAL"

            table_rows.append({
                "mine_id": m.id,
                "mine_name": m.name,
                "location": f"{m.district}, {m.state}",
                "zone": latest.zone or "Main Extraction Shaft",
                "risk_level": m.risk_level,
                "risk_score": m.risk_score,
                "methane": m_val,
                "methane_range": "< 1.0%",
                "methane_status": methane_status,
                "co": co_val,
                "co_range": "< 25 ppm",
                "co_status": co_status,
                "oxygen": o2_val,
                "oxygen_range": "19.5 – 23.5%",
                "oxygen_status": oxygen_status,
                "co2": latest.co2 if latest.co2 is not None else 0.15,
                "temperature": temp_val,
                "temp_range": "< 30°C",
                "temp_status": temp_status,
                "humidity": latest.humidity or 65.0,
                "dust": dust_val,
                "dust_range": "< 100 µg/m³",
                "dust_status": dust_status,
                "smoke": latest.smoke if latest.smoke is not None else 0.05,
                "pressure": latest.pressure if latest.pressure is not None else 101.3,
                "ventilation_flow": vent_val,
                "ventilation_range": "> 15 m³/min",
                "ventilation_status": vent_status,
                "air_quality": latest.air_quality or 68.0,
                "status": composite_status,
                "last_updated": time_str,
                "timestamp": latest.timestamp.isoformat()
            })
        else:
            table_rows.append({
                "mine_id": m.id,
                "mine_name": m.name,
                "location": f"{m.district}, {m.state}",
                "zone": "Main Extraction Shaft",
                "risk_level": m.risk_level,
                "risk_score": m.risk_score,
                "methane": 0.42,
                "methane_range": "< 1.0%",
                "methane_status": "NORMAL",
                "co": 12.0,
                "co_range": "< 25 ppm",
                "co_status": "NORMAL",
                "oxygen": 20.9,
                "oxygen_range": "19.5 – 23.5%",
                "oxygen_status": "SAFE",
                "co2": 0.12,
                "temperature": 27.2,
                "temp_range": "< 30°C",
                "temp_status": "NORMAL",
                "humidity": 65.0,
                "dust": 52.0,
                "dust_range": "< 100 µg/m³",
                "dust_status": "NORMAL",
                "smoke": 0.04,
                "pressure": 101.3,
                "ventilation_flow": 22.4,
                "ventilation_range": "> 15 m³/min",
                "ventilation_status": "NORMAL",
                "air_quality": 68.0,
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
