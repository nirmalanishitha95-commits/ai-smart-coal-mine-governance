import json
import time
import urllib.request
import urllib.error

RENDER_BACKEND = "https://ai-smart-coal-mine-governance.onrender.com"

def fetch_json(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("User-Agent", "MineSafe-Verifier/1.0")
    if data:
        req.add_header("Content-Type", "application/json")
        encoded_data = json.dumps(data).encode("utf-8")
    else:
        encoded_data = None
    try:
        with urllib.request.urlopen(req, data=encoded_data, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body
    except Exception as e:
        return 0, str(e)

def verify_all():
    print(f"Testing live production Render backend: {RENDER_BACKEND}")
    
    # 1. Health check
    code, res = fetch_json(f"{RENDER_BACKEND}/health")
    print(f"1. Health Check [{code}]: {res}")

    # 2. Trigger seed / migration if needed
    code, res = fetch_json(f"{RENDER_BACKEND}/api/compliance/init-seed", method="POST")
    print(f"2. Init-Seed Trigger [{code}]: {res}")

    # 3. Rescue Operations & Teams
    code, res = fetch_json(f"{RENDER_BACKEND}/api/rescue/operations")
    ops_count = len(res) if isinstance(res, list) else 0
    print(f"3. Rescue Operations [{code}]: {ops_count} operations returned")

    code, res = fetch_json(f"{RENDER_BACKEND}/api/rescue/teams")
    teams_count = len(res) if isinstance(res, list) else 0
    print(f"   Rescue Teams [{code}]: {teams_count} rescue squads returned")

    # 4. Workers Safety & Biometrics
    code, res = fetch_json(f"{RENDER_BACKEND}/api/workers")
    workers_count = len(res) if isinstance(res, list) else 0
    print(f"4. Workers Monitored [{code}]: {workers_count} underground miners tracked")

    # 5. Underground Mine Zones
    code, res = fetch_json(f"{RENDER_BACKEND}/api/zones")
    zones_count = len(res) if isinstance(res, list) else 0
    print(f"5. Underground Zones [{code}]: {zones_count} zones monitored")

    # 6. Hazards
    code, res = fetch_json(f"{RENDER_BACKEND}/api/hazards")
    hazards_count = len(res) if isinstance(res, list) else 0
    print(f"6. Hazard Detections [{code}]: {hazards_count} active hazards returned")

    # 7. Live Sensor Telemetry (11 Safety Parameters)
    code, res = fetch_json(f"{RENDER_BACKEND}/api/sensors/live-table")
    sensor_count = len(res) if isinstance(res, list) else 0
    print(f"7. Live Sensors [{code}]: {sensor_count} underground sensor nodes streaming (DEMO IoT STREAM)")

    # 8. Alerts
    code, res = fetch_json(f"{RENDER_BACKEND}/api/alerts?limit=100")
    count = len(res) if isinstance(res, list) else 0
    print(f"8. Emergency Alerts [{code}]: {count} records returned")

    # 9. Dashboard KPIs
    code, res = fetch_json(f"{RENDER_BACKEND}/api/dashboard")
    kpis = res.get("kpis", {}) if isinstance(res, dict) else {}
    print(f"9. Dashboard KPIs [{code}]: Active Mines={kpis.get('active_underground_mines', {}).get('value')}, Workers={kpis.get('workers_monitored', {}).get('value')}, Hazards={kpis.get('active_hazards', {}).get('value')}, Alerts={kpis.get('critical_alerts', {}).get('value')}")

    # 10. Public Data Sources (authoritative datasets intact)
    code, res = fetch_json(f"{RENDER_BACKEND}/api/data-sources")
    count = len(res) if isinstance(res, list) else 0
    print(f"10. Public Data Sources [{code}]: {count} sources intact (HISTORICAL GOVERNMENT/PUBLIC DATA)")

if __name__ == "__main__":
    verify_all()

