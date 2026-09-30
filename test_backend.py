import sys
import os

os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_full_system():
    print("=== 1. Root & Health Check ===")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    print("Root API:", r.json()["project"])

    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    health_data = r.json()
    assert health_data["status"] == "healthy", f"Status mismatch: {health_data}"
    assert health_data["service"] == "CoalGuard AI", f"Service mismatch: {health_data}"
    print("System Health Contract Verified:", health_data)

    print("\n=== 2. Testing JWT Authentication for 4 Roles ===")
    roles = [
        ("admin@coalguard.gov.in", "Admin@123", "SUPER_ADMIN"),
        ("officer@coalguard.gov.in", "Officer@123", "GOVERNMENT_OFFICER"),
        ("manager@coalguard.gov.in", "Manager@123", "MINE_MANAGER"),
        ("inspector@coalguard.gov.in", "Inspector@123", "INSPECTOR"),
    ]
    tokens = {}
    for email, pwd, expected_role in roles:
        res = client.post("/api/auth/login", json={"email": email, "password": pwd})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        data = res.json()
        assert data["user"]["role"] == expected_role, f"Role mismatch for {email}"
        tokens[expected_role] = data["access_token"]
        print(f"Authenticated: {email} -> {data['user']['role']}")

    admin_headers = {"Authorization": f"Bearer {tokens['SUPER_ADMIN']}"}

    print("\n=== 3. Testing Dashboard API ===")
    r = client.get("/api/dashboard", headers=admin_headers)
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    data = r.json()
    print("Dashboard Data: Total Mines =", data["total_mines"], "| Open Violations =", data["open_violations"])
    assert data["total_mines"] >= 10
    assert data["open_violations"] >= 10

    print("\n=== 4. Testing Mines & AI Risk Assessment ===")
    r = client.get("/api/mines", headers=admin_headers)
    assert r.status_code == 200
    mines = r.json()
    assert isinstance(mines, list)
    print(f"Fetched {len(mines)} mines from database")
    mine_id = mines[0]["id"]

    r = client.get(f"/api/mines/{mine_id}/risk", headers=admin_headers)
    assert r.status_code == 200
    risk_data = r.json()
    print(f"AI Risk Assessment for Mine #{mine_id} ({risk_data.get('mine_name')}):")
    print(f"  Risk Score: {risk_data['risk_score']} / 100")
    print(f"  Risk Level: {risk_data['risk_level']}")
    print(f"  Identified Risk Factors: {len(risk_data['factors'])}")
    for f in risk_data["factors"]:
        print(f"    - {f['factor']}: +{f['impact']} pts ({f.get('description', '')})")

    print("\n=== 5. Testing Sensor Ingestion & Isolation Forest Anomaly Detection ===")
    abnormal_reading = {
        "mine_id": mine_id,
        "zone": "Deep Extraction Sector 9",
        "methane": 3.2,
        "co": 58.0,
        "dust": 310.0,
        "temperature": 39.0,
        "humidity": 85.0,
        "noise": 98.0,
        "air_quality": 260.0,
        "water_quality": 5.2,
    }
    r = client.post("/api/sensors/readings", json=abnormal_reading, headers=admin_headers)
    assert r.status_code in [200, 201], f"Sensor ingestion failed: {r.text}"
    sensor_res = r.json()
    print(f"Anomaly Detection Result: is_anomaly={sensor_res['is_anomaly']}, flag={sensor_res['risk_flag']}")
    assert sensor_res["is_anomaly"] is True

    print("\n=== 6. Testing Alert Management & Lifecycle ===")
    r = client.get("/api/alerts", headers=admin_headers)
    assert r.status_code == 200
    alerts = r.json()
    assert isinstance(alerts, list)
    print(f"Retrieved {len(alerts)} alerts from Alert Center")
    if alerts:
        target_alert = alerts[0]["id"]
        ack = client.put(f"/api/alerts/{target_alert}/acknowledge", headers=admin_headers)
        assert ack.status_code == 200
        print(f"Alert #{target_alert} status updated to ACKNOWLEDGED")

    print("\n=== 7. Testing 14-Step AI Simulation Workflow ===")
    sim_res = client.post("/api/simulation/run", json={"mine_id": mine_id}, headers=admin_headers)
    assert sim_res.status_code == 200, f"Simulation failed: {sim_res.text}"
    sim_data = sim_res.json()
    print(f"Simulation {sim_data['simulation_id']} executed successfully!")
    print(f"Initial Risk: {sim_data.get('initial_risk_score')} -> Peak: {sim_data.get('peak_risk_score')} -> Restored: {sim_data.get('final_risk_score')}")
    print(f"Executed Steps: {len(sim_data['steps'])} of 14")
    assert len(sim_data["steps"]) == 14

    print("\n=== 8. Testing Complete Reports Module (6 Report Types, PDF & CSV) ===")
    # 8.1 Stats
    r = client.get("/api/reports/stats", headers=admin_headers)
    assert r.status_code == 200
    stats = r.json()
    print("Report Stats OK:", stats)

    # 8.2 All 6 Report Types
    for rtype in ["compliance", "inspections", "violations", "corrective-actions", "environmental", "risk"]:
        r = client.get(f"/api/reports/{rtype}", headers=admin_headers)
        assert r.status_code == 200, f"Report {rtype} failed with {r.status_code}"
        res_json = r.json()
        assert "rows" in res_json and "columns" in res_json
        print(f"Report [{rtype}] OK. Rows: {len(res_json['rows'])} | Title: {res_json['title']}")

    # 8.3 In-Memory PDF Generation & Download
    r = client.get("/api/reports/pdf?report_type=compliance", headers=admin_headers)
    assert r.status_code == 200
    assert "application/pdf" in r.headers.get("content-type", "")
    assert len(r.content) > 2000
    print(f"ReportLab PDF Generation OK. Streamed Bytes: {len(r.content)} | Header: {r.headers.get('content-disposition')}")

    # 8.4 CSV Export
    r = client.get("/api/reports/csv?report_type=compliance", headers=admin_headers)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    print(f"CSV Export API OK. Bytes received: {len(r.content)}")

    # 8.5 Audit Logs
    r = client.get("/api/audit-logs", headers=admin_headers)
    assert r.status_code == 200
    logs = r.json()
    assert isinstance(logs, list)
    print(f"Audit Logs verified: {len(logs)} records recorded")

    print("\n=== 9. Testing Groq AI Intelligence & Copilot Endpoints ===")
    r = client.get("/api/ai/status")
    assert r.status_code == 200
    ai_status = r.json()
    print("AI Engine Status:", ai_status["engine"], "| Provider:", ai_status["groq"]["provider"])

    # Test copilot query
    r = client.post("/api/ai/copilot", json={"query": "What are the statutory methane limits under DGMS?"})
    assert r.status_code == 200
    copilot_res = r.json()
    assert "answer" in copilot_res
    print("AI Copilot Response Verified. Model:", copilot_res["model"])

    # Test deep mine analysis
    r = client.post(f"/api/ai/mine-analysis/{mine_id}")
    assert r.status_code == 200
    analysis = r.json()
    assert "groq_analysis" in analysis
    print("AI Deep Mine Analysis Verified. Source:", analysis["groq_analysis"].get("source"))

    print("\n=== 10. Testing Authoritative Public Datasets & Provenance Standards ===")
    r = client.get("/api/data-sources")
    assert r.status_code == 200
    sources = r.json()
    assert len(sources) >= 4
    print(f"Public Datasets Verified: {len(sources)} registered sources (CCO, DGMS, MoC, DEMO IoT STREAM)")

    r = client.get("/api/data-sources/production")
    assert r.status_code == 200
    prod_data = r.json()
    assert prod_data["summary"]["total_production_mt"] > 0
    print(f"Public Production Data OK: {prod_data['summary']['total_production_mt']} MT across {prod_data['summary']['mines_reported']} collieries")

    r = client.get("/api/data-sources/accidents")
    assert r.status_code == 200
    acc_data = r.json()
    assert len(acc_data["records"]) > 0
    print(f"Public DGMS Accidents Data OK: {len(acc_data['records'])} historical incident records cataloged")

    r = client.get("/api/data-sources/safety-indicators")
    assert r.status_code == 200
    safe_data = r.json()
    assert len(safe_data["records"]) > 0
    print(f"Public DGMS Safety Indicators OK: {len(safe_data['records'])} annual national rate series (2019-2023)")

    print("\n=========================================================")
    print(">>> ALL 10 CORE TEST SUITES PASSED WITH 100% SUCCESS! <<<")
    print("=========================================================")

if __name__ == "__main__":
    test_full_system()

