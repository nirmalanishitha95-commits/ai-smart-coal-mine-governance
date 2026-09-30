# AI-Powered Underground Mine Safety Monitoring and Rescue System

> **Smart India Hackathon 2026 (SIH 2026)**  
> **Official Project Title**: AI-Powered Underground Mine Safety Monitoring and Rescue System  
> **Tagline**: *"AI-powered real-time underground mine safety surveillance, multi-gas telemetry, hazard mitigation, and autonomous emergency rescue operations."*

---

## 📌 Project Overview

The **AI-Powered Underground Mine Safety Monitoring and Rescue System** (short name: **AI MineSafe**) is an enterprise-grade digital safety and emergency rescue platform built for underground collieries, mine rescue teams, statutory regulatory bodies (Directorate General of Mines Safety - DGMS, Ministry of Coal), and colliery general managers across India.

Underground coal mines present extreme operational hazards including explosive methane (CH₄) gas accumulations, toxic carbon monoxide (CO) inrushes, acute oxygen (O₂) depletion, spontaneous combustion, respirable dust, and ventilation failure. Traditional mine safety relies on manual tube sampling and retrospective reporting, which introduces critical latency when seconds determine human survival.

This system unifies **real-time atmospheric sensor telemetry**, **Scikit-Learn Isolation Forest anomaly detection**, **explainable composite risk scoring**, **underground worker tracking**, **emergency incident lifecycles**, and **tactical rescue squad dispatch** into a mission-critical safety platform.

---

## 🎯 Core System Capabilities

1. **Real-Time Underground Mine Monitoring**: Continuous surveillance across colliery shafts, incline drifts, and extraction faces.
2. **Real-Time Environmental & Safety Sensor Monitoring**: Live multi-gas and atmospheric parameters provided by backend:
   - **Methane (CH₄)**: Normal (`< 1.0%`) → Warning (`1.0% – 2.0%`) → Critical (`> 2.0%`)
   - **Carbon Monoxide (CO)**: Normal (`< 25 ppm`) → Warning (`25 – 50 ppm`) → Critical (`> 50 ppm`)
   - **Oxygen (O₂)**: Safe (`19.5% – 23.5%`) → Warning (`18.0% – 19.5%`) → Critical (`< 18.0%`)
   - **Carbon Dioxide (CO₂)**: Normal (`< 0.5%`) → Warning (`0.5% – 1.0%`) → Critical (`> 1.0%`)
   - **Temperature**: Normal (`< 30°C`) → High (`30°C – 38°C`) → Critical (`> 38°C`)
   - **Relative Humidity**: Nominal range `40% – 80%`
   - **Respirable Dust (PM10)**: Normal (`< 100 µg/m³`) → Elevated (`100 – 200 µg/m³`) → Critical (`> 200 µg/m³`)
   - **Air Quality Index (AQI)**: Composite air quality index
   - **Smoke Obscuration**: Normal (`0.0 – 0.2 obs`) → Warning (`0.2 – 0.5 obs`) → Critical (`> 0.5 obs`)
   - **Barometric Pressure**: Normal range `98 – 104 kPa`
   - **Ventilation Airflow**: Normal (`> 15 m³/min`) → Warning (`10 – 15 m³/min`) → Failure (`< 10 m³/min`)
3. **Hazard Detection**: Automated identification of toxic gas surges, fire risks, roof stress, and ventilation interruptions.
4. **AI Anomaly Detection**: Unsupervised Scikit-Learn Isolation Forest detecting subtle multi-sensor excursions before catastrophic failure.
5. **AI Risk Assessment**: Deterministic explainable 0–100 scoring with full mathematical factor attribution:
   - `0 – 30`: **LOW** (Nominal operating conditions)
   - `31 – 60`: **MEDIUM** (Operational items requiring remediation)
   - `61 – 80`: **HIGH** (Priority statutory audit required)
   - `81 – 100`: **CRITICAL** (Immediate evacuation & rescue mobilization)
   - *Mandatory AI Disclaimer*: "AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions."
6. **Worker Safety Monitoring**: Tracking miner ID, name, colliery, underground zone, safety status (`SAFE`, `WARNING`, `AT RISK`, `EMERGENCY`, `EVACUATED`, `RESCUED`), biometric vitals (heart rate, body temperature), battery level, and last known beacon position (`DEMO WORKER LOCATION`).
7. **Underground Mine Zone Monitoring**: Sector-level management across all 8 underground zone categories:
   - Main Shaft
   - Tunnel
   - Coal Face
   - Ventilation Zone
   - Conveyor Zone
   - Equipment Area
   - Emergency Exit
   - Rescue Assembly Area
8. **Emergency Alerts**: P1 Critical to P4 Low priority queues with acknowledgment and officer assignment workflows.
9. **Emergency Incident Management**: Complete statutory incident tracking with hazard location, affected miners, and resolution milestones.
10. **Rescue Team Management**: Roster of certified mine rescue squads equipped with self-contained breathing apparatus (SCBA).
11. **Rescue Operation Tracking**: End-to-end mission lifecycle:
    $$\text{Sensor Monitoring} \to \text{Hazard Detection} \to \text{AI Anomaly} \to \text{Risk Assessment} \to \text{Alert} \to \text{Identify Affected Workers} \to \text{Create Incident} \to \text{Assign Rescue Team} \to \text{Rescue In Progress} \to \text{Evacuation/Rescue} \to \text{Resolved}$$
12. **Safety Inspections**: Standardized digital checklists for statutory mine auditors under Coal Mines Regulations (CMR) 2017.
13. **Safety Compliance**: Centralized regulatory registry tracking mandatory statutory rule fulfillment.
14. **Official Safety Reports**: In-memory PDF dossiers (ReportLab) and CSV exports:
    - Underground Mine Safety Report
    - Real-Time Sensor Report
    - Hazard Detection Report
    - Emergency Incident Report
    - Rescue Operation Report
    - AI Risk Assessment Report
    - Safety Inspection Report
    - Historical Safety Analysis Report
15. **Historical Real/Public Mining Safety Data Analysis**: Authoritative public datasets from Coal Controller's Organisation (CCO), Directorate General of Mines Safety (DGMS), and Ministry of Coal (MoC).

---

## 🏛️ Authoritative Data Provenance & Telemetry Integrity

The platform maintains absolute transparency regarding data origin:

| Data Category | Data Origin / Source | Classification Label | Purpose |
| :--- | :--- | :--- | :--- |
| **Colliery Master Registry** | Ministry of Coal (MoC), Coal Directory | `HISTORICAL GOVERNMENT/PUBLIC DATA` | Authentic colliery details, coordinates, ownership |
| **Coal Production & Despatch** | Coal Controller’s Organisation (CCO) | `HISTORICAL GOVERNMENT/PUBLIC DATA` | Official production statistics (2022–2023) |
| **Fatal & Serious Accidents** | Directorate General of Mines Safety (DGMS) | `HISTORICAL GOVERNMENT/PUBLIC DATA` | Historical safety analysis & accident rate series |
| **Simulated Multi-Gas Telemetry** | Backend Stream Worker (`sensor_stream_service.py`) | `DEMO IoT STREAM` | Simulated evaluation stream; ready for live MQTT field gateway |
| **Miner Underground Location** | Radio Beacon Simulator | `DEMO WORKER LOCATION` | Simulated spatial beacon positioning |

---

## 🤖 Groq LPU AI Copilot

The platform integrates a server-side **Groq Cloud LPU** (`llama-3.3-70b-versatile`) answering critical safety and rescue queries:
- *Why is this mine high risk?*
- *What caused this alert?*
- *What hazards are active?*
- *Which workers are affected?*
- *What safety action is recommended?*
- *Summarize this emergency incident.*
- *Summarize this rescue operation.*

*Security note: The `GROQ_API_KEY` is maintained strictly backend-only and is never exposed to client browsers.*

---

## 👥 Role Personas & Evaluation Credentials

| Role | Name | Email | Password | Scope & Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Mine Rescue Chief / Controller | `admin@coalguard.gov.in` | `Admin@123` | National colliery overview, rescue commands, audit logs |
| **Govt Officer** | DGMS Safety Officer | `officer@coalguard.gov.in` | `Officer@123` | Hazard review, rescue authorization, incident sign-offs |
| **Mine Manager** | Colliery Safety Lead | `manager@coalguard.gov.in` | `Manager@123` | Worker vitals, local gas telemetry, evacuation controls |
| **Inspector** | Statutory Mine Auditor | `inspector@coalguard.gov.in` | `Inspector@123` | Field safety inspection checklists & violation notices |

---

## 🏗️ Technical Architecture & Render Deployment

```
Render Frontend (React + Vite + TailwindCSS)
      │
      ▼  HTTPS / REST / WebSocket
Render FastAPI Web Service (Python 3.11+, Scikit-Learn, ReportLab)
      │
      ├──────► Render Managed PostgreSQL (All tables & relations)
      ├──────► Groq Cloud LPU (llama-3.3-70b-versatile)
      └──────► Telemetry Worker (DEMO IoT STREAM / Future Live IoT)
```

* **Frontend Production URL**: `https://ai-smart-coal-mine-frontend.onrender.com`
* **Backend Production URL**: `https://ai-smart-coal-mine-governance.onrender.com`
* **Interactive API Documentation**: `https://ai-smart-coal-mine-governance.onrender.com/docs`
* **Health Endpoint**: `https://ai-smart-coal-mine-governance.onrender.com/health`

---

## 🧪 Local Verification & Testing

```bash
# 1. Run Comprehensive Backend Test Suite (All 11 Suites)
python test_backend.py

# 2. Build Frontend for Production
cd frontend
npm run build
```

---

## ⚖️ Legal & Regulatory Notice

*AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions. Historical data reflects official DGMS & CCO public releases. Real-time telemetry is labeled as DEMO IoT STREAM for prototype evaluation.*
