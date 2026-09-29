from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db, SessionLocal
from backend.app.models.models import SensorReading, Mine, Alert
from backend.app.schemas.schemas import SensorReadingCreate, SensorReadingResponse
from backend.app.ai.anomaly_detector import anomaly_detector
from backend.app.ai.risk_engine import evaluate_mine_risk
from backend.app.services.audit_service import log_audit_action
from backend.app.services.sensor_stream_service import (
    get_current_sensor_provider, connection_manager, get_live_sensor_table_data
)

router = APIRouter(prefix="/sensors", tags=["Sensors & Environmental"])

@router.get("/readings", response_model=List[SensorReadingResponse])
def get_sensor_readings(
    mine_id: Optional[int] = Query(None),
    anomalies_only: Optional[bool] = Query(False),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading).join(Mine)

    if mine_id:
        query = query.filter(SensorReading.mine_id == mine_id)
    if anomalies_only:
        query = query.filter(SensorReading.is_anomaly == True)

    readings = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()

    result = []
    for r in readings:
        result.append({
            "id": r.id,
            "mine_id": r.mine_id,
            "mine_name": r.mine.name if r.mine else None,
            "zone": r.zone,
            "data_source": getattr(r, "data_source", "DEMO IoT STREAM") or "DEMO IoT STREAM",
            "methane": r.methane,
            "co": r.co,
            "dust": r.dust,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "noise": r.noise,
            "air_quality": r.air_quality,
            "water_quality": r.water_quality,
            "is_anomaly": r.is_anomaly,
            "anomaly_score": r.anomaly_score,
            "risk_flag": r.risk_flag,
            "timestamp": r.timestamp
        })
    return result

@router.post("/readings", response_model=SensorReadingResponse)
def ingest_sensor_reading(
    reading_in: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    mine = db.query(Mine).filter(Mine.id == reading_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    # Run Isolation Forest Anomaly Detection
    analysis = anomaly_detector.analyze_reading({
        "methane": reading_in.methane,
        "co": reading_in.co,
        "dust": reading_in.dust,
        "temperature": reading_in.temperature,
        "humidity": reading_in.humidity,
        "noise": reading_in.noise,
        "air_quality": reading_in.air_quality,
        "water_quality": reading_in.water_quality
    })

    now = datetime.now(timezone.utc)
    new_reading = SensorReading(
        mine_id=reading_in.mine_id,
        zone=reading_in.zone or "Shaft A - Section 3",
        methane=reading_in.methane,
        co=reading_in.co,
        dust=reading_in.dust,
        temperature=reading_in.temperature,
        humidity=reading_in.humidity,
        noise=reading_in.noise,
        air_quality=reading_in.air_quality,
        water_quality=reading_in.water_quality,
        is_anomaly=analysis["is_anomaly"],
        anomaly_score=analysis["anomaly_score"],
        risk_flag=analysis["risk_flag"],
        timestamp=now
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    # If anomaly detected: generate alert and log audit
    if analysis["is_anomaly"]:
        alert_msg = f"[AI SENSOR ANOMALY] {mine.name} ({new_reading.zone}): " + ", ".join(analysis["triggers"] or ["Statistical outlier detected by Isolation Forest"])
        alert = Alert(
            mine_id=mine.id,
            alert_type="Critical Sensor Anomaly",
            severity="CRITICAL" if analysis["risk_flag"] == "CRITICAL" else "HIGH",
            message=alert_msg,
            timestamp=now,
            status="UNREAD"
        )
        db.add(alert)

        # Trigger AI risk update
        evaluate_mine_risk(mine.id, db)

        log_audit_action(
            db=db,
            user=None,
            action="Sensor Anomaly Detected",
            entity="SensorReading",
            entity_id=new_reading.id,
            details=f"Isolation Forest flagged anomaly at {mine.name}. Score: {analysis['anomaly_score']}."
        )

    return {
        "id": new_reading.id,
        "mine_id": new_reading.mine_id,
        "mine_name": mine.name,
        "zone": new_reading.zone,
        "data_source": new_reading.data_source or "DEMO IoT STREAM",
        "methane": new_reading.methane,
        "co": new_reading.co,
        "dust": new_reading.dust,
        "temperature": new_reading.temperature,
        "humidity": new_reading.humidity,
        "noise": new_reading.noise,
        "air_quality": new_reading.air_quality,
        "water_quality": new_reading.water_quality,
        "is_anomaly": new_reading.is_anomaly,
        "anomaly_score": new_reading.anomaly_score,
        "risk_flag": new_reading.risk_flag,
        "timestamp": new_reading.timestamp
    }

@router.get("/environmental/summary")
def get_environmental_summary(
    mine_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns live parameter telemetry with demonstration thresholds and historical charts.
    """
    query = db.query(SensorReading)
    if mine_id:
        query = query.filter(SensorReading.mine_id == mine_id)

    latest = query.order_by(desc(SensorReading.timestamp)).first()

    if not latest:
        # Default mock baseline
        latest_vals = {
            "methane": 0.45, "co": 12.0, "dust": 55.0,
            "temperature": 27.5, "humidity": 65.0,
            "noise": 72.0, "air_quality": 68.0, "water_quality": 7.3,
            "timestamp": datetime.now(timezone.utc)
        }
    else:
        latest_vals = {
            "methane": latest.methane,
            "co": latest.co,
            "dust": latest.dust,
            "temperature": latest.temperature,
            "humidity": latest.humidity,
            "noise": latest.noise,
            "air_quality": latest.air_quality,
            "water_quality": latest.water_quality,
            "timestamp": latest.timestamp
        }

    # Fetch last 12 readings for history trend
    history_records = query.order_by(desc(SensorReading.timestamp)).limit(12).all()
    history_points = [
        {
            "time": r.timestamp.strftime("%H:%M") if r.timestamp else "12:00",
            "methane": r.methane,
            "co": r.co,
            "dust": r.dust,
            "temperature": r.temperature,
            "air_quality": r.air_quality
        }
        for r in reversed(history_records)
    ]

    parameters = [
        {
            "id": "methane",
            "name": "Methane (CH4)",
            "value": latest_vals["methane"],
            "unit": "%",
            "threshold": 1.0,
            "critical_threshold": 2.0,
            "status": "CRITICAL" if latest_vals["methane"] >= 2.0 else ("WARNING" if latest_vals["methane"] >= 1.0 else "NORMAL"),
            "description": "Permissible underground limit: < 1.0% volume.",
            "category": "Flammable Gas"
        },
        {
            "id": "co",
            "name": "Carbon Monoxide (CO)",
            "value": latest_vals["co"],
            "unit": "ppm",
            "threshold": 25.0,
            "critical_threshold": 50.0,
            "status": "CRITICAL" if latest_vals["co"] >= 50.0 else ("WARNING" if latest_vals["co"] >= 25.0 else "NORMAL"),
            "description": "Toxic combustion indicator. Threshold: 25 ppm.",
            "category": "Toxic Gas"
        },
        {
            "id": "dust",
            "name": "Respirable Dust (PM10)",
            "value": latest_vals["dust"],
            "unit": "µg/m³",
            "threshold": 100.0,
            "critical_threshold": 250.0,
            "status": "CRITICAL" if latest_vals["dust"] >= 250.0 else ("WARNING" if latest_vals["dust"] >= 100.0 else "NORMAL"),
            "description": "Standard: < 100 µg/m³. Prevents pneumoconiosis.",
            "category": "Particulate Matter"
        },
        {
            "id": "temperature",
            "name": "Ambient Temperature",
            "value": latest_vals["temperature"],
            "unit": "°C",
            "threshold": 35.0,
            "critical_threshold": 42.0,
            "status": "CRITICAL" if latest_vals["temperature"] >= 42.0 else ("WARNING" if latest_vals["temperature"] >= 35.0 else "NORMAL"),
            "description": "Wet-bulb and dry-bulb ambient comfort index.",
            "category": "Thermal Comfort"
        },
        {
            "id": "humidity",
            "name": "Relative Humidity",
            "value": latest_vals["humidity"],
            "unit": "%",
            "threshold": 80.0,
            "critical_threshold": 90.0,
            "status": "WARNING" if latest_vals["humidity"] >= 80.0 else "NORMAL",
            "description": "Ventilation moisture and heat stress factor.",
            "category": "Atmospheric"
        },
        {
            "id": "air_quality",
            "name": "Mine Air Quality Index (AQI)",
            "value": latest_vals["air_quality"],
            "unit": "AQI",
            "threshold": 150.0,
            "critical_threshold": 250.0,
            "status": "CRITICAL" if latest_vals["air_quality"] >= 250.0 else ("WARNING" if latest_vals["air_quality"] >= 150.0 else "NORMAL"),
            "description": "Composite index from multiple air stations.",
            "category": "Air Quality"
        },
        {
            "id": "water_quality",
            "name": "Discharge Water pH",
            "value": latest_vals["water_quality"],
            "unit": "pH",
            "threshold": 6.5,
            "critical_threshold": 5.5,
            "status": "CRITICAL" if latest_vals["water_quality"] < 5.5 or latest_vals["water_quality"] > 9.0 else ("WARNING" if latest_vals["water_quality"] < 6.5 or latest_vals["water_quality"] > 8.5 else "NORMAL"),
            "description": "Acid Mine Drainage prevention standard: 6.5 - 8.5.",
            "category": "Effluent"
        }
    ]

    return {
        "disclaimer": "DEMO / SIMULATED SENSOR DATA FOR HACKATHON DEMONSTRATION",
        "last_updated": latest_vals["timestamp"],
        "parameters": parameters,
        "history": history_points
    }


@router.get("/realtime-feed")
def get_realtime_feed(db: Session = Depends(get_db)):
    """
    Returns real-time IoT multi-gas sensor stream packet.
    Includes data source label ('DEMO IoT STREAM'), live sensor table, recent anomaly alerts,
    and rolling parameter history for Recharts.
    """
    provider = get_current_sensor_provider()
    # Ingest a live simulated reading each time or fetch latest
    result = provider.generate_or_fetch_reading(db)

    # Get updated table across all mines
    table_data = get_live_sensor_table_data(db)

    # Fetch last 40 readings for chart
    chart_readings = (
        db.query(SensorReading)
        .order_by(desc(SensorReading.timestamp))
        .limit(40)
        .all()
    )
    chart_history = [
        {
            "id": r.id,
            "time": r.timestamp.strftime("%H:%M:%S") if r.timestamp else "12:00:00",
            "mine_name": r.mine.name if r.mine else f"Mine #{r.mine_id}",
            "methane": r.methane,
            "co": r.co,
            "dust": r.dust,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "air_quality": r.air_quality,
            "water_quality": r.water_quality,
            "is_anomaly": r.is_anomaly,
            "risk_flag": r.risk_flag
        }
        for r in reversed(chart_readings)
    ]

    # Active recent anomaly if any
    recent_anomaly_alert = (
        db.query(Alert)
        .filter(Alert.alert_type.like("%Anomaly%"))
        .order_by(desc(Alert.timestamp))
        .first()
    )
    active_anomaly = None
    if recent_anomaly_alert:
        active_anomaly = {
            "id": recent_anomaly_alert.id,
            "mine_id": recent_anomaly_alert.mine_id,
            "mine_name": recent_anomaly_alert.mine.name if recent_anomaly_alert.mine else "Monitored Mine",
            "message": recent_anomaly_alert.message,
            "severity": recent_anomaly_alert.severity,
            "timestamp": recent_anomaly_alert.timestamp.isoformat() if recent_anomaly_alert.timestamp else datetime.now(timezone.utc).isoformat()
        }

    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "status": "LIVE",
        "data_source": provider.get_data_source_label(),
        "provider": provider.get_provider_name(),
        "last_updated": now_iso,
        "latest_reading": result.get("reading"),
        "anomaly_notification": result.get("anomaly_notification"),
        "active_anomaly": active_anomaly,
        "table": table_data,
        "chart_history": chart_history
    }


@router.post("/trigger-tick")
def trigger_sensor_tick(db: Session = Depends(get_db)):
    """Manually trigger a real-time sensor reading generation for demo simulation."""
    provider = get_current_sensor_provider()
    result = provider.generate_or_fetch_reading(db)
    return {
        "success": True,
        "data_source": provider.get_data_source_label(),
        "result": result
    }


@router.websocket("/ws")
async def websocket_sensors_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sensor streaming.
    Pushes live sensor reading packets directly to the frontend.
    """
    await connection_manager.connect(websocket)
    try:
        # Send initial welcome packet
        db = SessionLocal()
        try:
            table_data = get_live_sensor_table_data(db)
            provider = get_current_sensor_provider()
            await websocket.send_json({
                "type": "INITIAL_STATE",
                "data_source": provider.get_data_source_label(),
                "table": table_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        finally:
            db.close()

        # Listen for messages or keep connection alive
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "tick":
                db = SessionLocal()
                try:
                    provider = get_current_sensor_provider()
                    res = provider.generate_or_fetch_reading(db)
                    table_data = get_live_sensor_table_data(db)
                    await websocket.send_json({
                        "type": "TICK_UPDATE",
                        "data_source": provider.get_data_source_label(),
                        "reading": res.get("reading"),
                        "anomaly": res.get("anomaly_notification"),
                        "table": table_data,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                finally:
                    db.close()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception:
        connection_manager.disconnect(websocket)
