# AI-Based Smart Governance and Compliance Monitoring System for Coal Mines

> **Smart India Hackathon 2026 (SIH 2026)**  
> **Problem Statement**: Development of an AI-Based Smart Governance and Compliance Monitoring System for Coal Mines to track statutory safety, environmental regulations, hazard telemetry, and corrective actions in real time.  
> **Tagline**: *"AI-powered compliance, safety, and environmental monitoring for smarter and safer coal mining."*

---

## 📌 Project Overview

**CoalGuard AI** is an enterprise digital governance and compliance monitoring system engineered for statutory regulatory bodies (Ministry of Coal, Directorate General of Mines Safety - DGMS) and colliery operators across India.

Coal mining operations present high-risk operating environments characterized by explosive methane emissions, toxic carbon monoxide accumulation, respirable coal dust hazards, and complex statutory frameworks. Traditional compliance monitoring relies on manual inspections, paper logbooks, and retrospective reporting, which introduces severe delays in detecting safety anomalies and remediating violations.

CoalGuard AI modernizes this process into an **autonomous closed-loop governance platform** combining real-time IoT multi-gas telemetry, machine learning anomaly detection, explainable risk scoring, digital inspection workflows, automated violation tracking, and Groq-powered AI copilot assistance.

---

## 🎯 Problem Statement & Solution

### The Problem
* **Delayed Incident Detection**: In underground and opencast coal mines, atmospheric hazards (CH₄ gas surges, CO buildup) can escalate in minutes, while manual sampling takes hours or days.
* **Fragmented Compliance Silos**: Safety inspections, environmental effluent records, equipment maintenance logs, and statutory notices are managed in disparate spreadsheets or physical files.
* **Lack of Accountability**: Corrective action plans (CAPA) often languish past statutory deadlines without automated escalation to district and national mining officers.
* **Subjective Risk Auditing**: Mine safety evaluations historically lacked continuous, multi-dimensional risk scoring.

### The Solution: CoalGuard AI
* **Continuous IoT Telemetry**: Auto-ingests and visualizes CH₄, CO, PM10/PM2.5 dust, temperature, humidity, and airflow readings across colliery shafts.
* **Unsupervised Anomaly ML**: Deploys Scikit-Learn Isolation Forest models trained on mining baselines to detect subtle sensor anomalies before fatal surges occur.
* **Deterministic Explainable Risk Engine**: Dynamically calculates a 0–100 composite risk score with clear point attribution (+30 gas surge, +25 high-severity violations, +15 overdue CAPAs).
* **Statutory Role-Based Portal**: 4 distinct role personas (National Coal Controller, DGMS Officer, Mine Manager, Statutory Safety Inspector).
* **Automated Corrective Actions**: Dispatches SLA-tracked CAPA workflows upon failed digital inspection checklists.
* **Groq LPU Safety Copilot**: Server-side LLM copilot (`llama-3.3-70b-versatile`) provides contextual safety summaries, mine dossier analysis, and statutory citations under the Coal Mines Regulations (CMR).

---

## ⭐ Key Features

### 1. AI/ML Features
* **Multi-Gas Anomaly Detection**: Isolation Forest model detects multi-variate deviations across methane, CO, dust, temperature, and airflow.
* **Explainable Composite Risk Scoring**: Calculates mine risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with transparent mathematical factor breakdown.
* **Groq LPU Intelligence**: Cloud LPU LLM synthesis analyzing mine dossiers, recurring non-compliance patterns, and recommending statutory DGMS actions.
* **Autonomous 14-Step Simulation Engine**: Built-in demonstration engine executing the entire lifecycle from sensor spike to DGMS closure.

### 2. Real-Time Monitoring
* Live multi-parameter telemetry stream with auto-refresh every 6 seconds.
* Interactive visual sparklines and Recharts gauges for gas thresholds (DGMS statutory limits).
* Real-time active hazard banner alerting operators to out-of-boundary parameters.

### 3. Compliance Management
* Centralized digital registry of statutory regulations (DGMS, Coal Mines Regulations, Environmental Protection Acts).
* Mandatory vs. discretionary rule classification with automated compliance rate tracking.

### 4. Inspection Management
* 7-point standardized digital checklist for statutory mine inspectors.
* Automatic violation generation upon negative responses.
* Inspection scheduling, field notes, and digital sign-off.

### 5. Violation Management
* Severity classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
* Direct linkage between statutory rules, colliery shafts, and issued notices.
* Evidence upload and verification tracking.

### 6. Corrective Actions (CAPA)
* Mandatory remedial action plans assigned to mine general managers.
* Time-bound SLAs with overdue risk escalation penalties.
* Multi-stage verification workflow (Draft → In Progress → Review → Approved).

### 7. Alerts & Early Warnings
* Priority-ranked notification queue (P1 Critical, P2 High, P3 Medium, P4 Low).
* One-click acknowledgment and officer assignment.
* Historical alert archive with resolution timestamps.

### 8. Analytics & Dashboards
* National command center displaying geospatial mine map (Leaflet GIS).
* Real-time statutory compliance KPI cards (Active Mines, Overall Compliance Rate, Open Violations, Overdue Actions).
* Visual risk distribution charts and incident telemetry trend lines.

### 9. Statutory Reports Module
* **6 Standardized Regulatory Report Types**:
  1. *Mine Statutory Compliance Report* (`/api/reports/compliance`): Multi-mine regulatory adherence metrics and non-compliance counts.
  2. *Safety & Statutory Inspection Report* (`/api/reports/inspections`): Checklist items, scoring, inspector certifications, and follow-ups.
  3. *Regulatory Violations & Penalties Report* (`/api/reports/violations`): CMR citation details, severity rankings, and financial penalty assessments.
  4. *Corrective & Preventive Action (CAPA) Report* (`/api/reports/corrective-actions`): SLA deadlines, escalation status, and remedial steps.
  5. *Environmental & Atmospheric Monitoring Report* (`/api/reports/environmental`): Sensor averages, gas threshold excursions, and air quality metrics.
  6. *AI Risk Assessment & Prioritization Report* (`/api/reports/risk`): Multi-factor risk scores, risk levels, and explainable point breakdown.
* **In-Memory PDF Generation**: Built using ReportLab to generate official government-styled inspection dossiers in memory (`io.BytesIO()`) without local disk persistence, ensuring 100% compatibility with Render's ephemeral container environment.
* **Full CSV Export**: Direct raw export of filtered database records for analysis in Excel or statistical packages.
* **Interactive Preview**: In-browser data table preview with responsive pagination and KPI summary chips.

### 10. Authoritative Public Datasets & Data Provenance Policy
CoalGuard AI strictly complies with high standards of data integrity and provenance. **No government statistics are fabricated, and simulated telemetry is never conflated with real historical data.**

* **Real Public Datasets Integrated**:
  - **Ministry of Coal (MoC)**: Colliery registry, mine ownership (CIL subsidiaries: BCCL, CCL, ECL, SECL, WCL, MCL, NCL, SCCL), operational types (Underground vs. Opencast), and geographical coordinates.
  - **Coal Controller’s Organisation (CCO)**: *Provisional Coal Statistics 2022-23* covering colliery-level coal production, coking vs. non-coking breakdown, and offtake/despatch volumes.
  - **Directorate General of Mines Safety (DGMS)**: *Standard Safety Statistics & Annual Returns (2018–2023)* detailing national and mine-level fatal and serious accidents, rates per 1,000 workers employed, and rates per million tonnes (MT) of coal extracted.
  - **Central Pollution Control Board (CPCB)**: *National Ambient Air Quality Standards (NAAQS)* for coal mining areas.
* **Data Provenance Labels**:
  - `Historical Government Data`: Assigned to all authentic datasets imported from CCO, DGMS, and Ministry of Coal, citing source URL and publication period.
  - `DEMO IoT STREAM`: Clearly labeled on simulated real-time multi-gas sensor feeds.
  - `LIVE IoT DATA`: Supported architecture for seamless switching when authorized SCADA/IoT edge gateways are linked.
* **AI Disclaimer**: All AI risk scores and recommendations explicitly state: *"AI-assisted prototype assessment. Not an official regulatory decision."*
* **Dedicated Data Sources Catalog (`/data-sources`)**:
  - In-app interactive portal displaying the metadata, source organization, source URLs, publication periods, record counts, and last sync timestamp for all authoritative datasets.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v7, Recharts, Leaflet, React Leaflet, Lucide Icons, Vanilla CSS |
| **Backend** | Python 3.11/3.14, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PyJWT, Passlib, ReportLab |
| **Database** | PostgreSQL 16 (Render Managed PostgreSQL), SQLite (Local Fallback) |
| **AI / ML** | Groq API (`llama-3.3-70b-versatile`), Scikit-Learn Isolation Forest, NumPy, Pandas |
| **Deployment** | Render Web Service (FastAPI), Render Static Site (React SPA), Render PostgreSQL |

---

## 🏛 System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │           Client Web Browser            │
                       │   (Desktop, Tablet, Mobile Dashboard)   │
                       └────────────────────┬────────────────────┘
                                            │ HTTPS / WSS
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │      Render Static Site (Frontend)      │
                       │          React 18 + Vite (SPA)          │
                       │     Rewrites: /* -> /index.html         │
                       └────────────────────┬────────────────────┘
                                            │ REST API [VITE_API_URL]
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │      Render Web Service (Backend)       │
                       │         FastAPI Engine (Python)         │
                       │   uvicorn app.main:app --port $PORT     │
                       └──────┬───────────────────┬──────────────┘
                              │                   │
                     SQLAlchemy ORM          Groq API Client
                              ▼                   ▼
     ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
     │         Render PostgreSQL         │    │          Groq Cloud LPU           │
     │      (Relational DB Service)      │    │     (llama-3.3-70b-versatile)     │
     │  - 17 Normalized Schema Tables    │    │  - Statutory Compliance Copilot   │
     │  - Mines, Rules, Telemetry, CAPA  │    │  - Deep Mine Dossier Synthesis    │
     └───────────────────────────────────┘    └───────────────────────────────────┘
```

### Architectural Highlights
1. **Frontend**: Static React single-page application served via high-speed CDN with SPA routing rewrites.
2. **Backend**: Asynchronous FastAPI service running on Uvicorn, auto-scaling and monitoring health via `GET /health`.
3. **Database**: Managed PostgreSQL hosting normalized tables with foreign-key integrity, cascade handling, and automated seeding.
4. **AI Layer**: Dual-tier AI architecture with on-server Scikit-Learn Isolation Forest for instant telemetry scoring and Groq LPU LLM for contextual advisory reports.

---

## 📂 Project Structure

```text
coalguard-ai/
├── backend/                             # Python FastAPI Backend Engine
│   ├── app/
│   │   ├── ai/                          # Machine Learning & Simulation Logic
│   │   │   ├── anomaly_detector.py      # Isolation Forest Anomaly Detector
│   │   │   ├── risk_engine.py           # Multi-Factor Explainable Risk Scoring
│   │   │   └── simulation_service.py    # 14-Step Autonomous Governance Loop
│   │   ├── api/                         # 14 Modular REST API Routers
│   │   │   ├── auth.py                  # JWT Login, Register, Role Verification
│   │   │   ├── mines.py                 # Mine CRUD, GIS Coordinates, Risk Scores
│   │   │   ├── sensors.py               # IoT Telemetry Ingestion & WebSockets
│   │   │   ├── compliance.py            # Statutory Rules & Assessments
│   │   │   ├── inspections.py           # 7-Question Digital Checklists
│   │   │   ├── violations.py            # Regulatory Notices & Severities
│   │   │   ├── actions.py               # CAPA Remedial Action Plans
│   │   │   ├── alerts.py                # Early Warning Alert Center
│   │   │   ├── reports.py               # Dossier Summaries, In-Memory PDF & CSV Exports
│   │   │   ├── data_sources.py          # Authoritative Public Datasets & Registry
│   │   │   ├── ai.py                    # Groq Copilot & Mine Analysis
│   │   │   └── audit.py                 # Immutable Audit Log Trail
│   │   ├── database/                    # SQLAlchemy Engine & PostgreSQL Session
│   │   ├── models/                      # 21 Relational ORM Models
│   │   ├── schemas/                     # Pydantic Request & Response Models
│   │   ├── services/                    # Seed Service, PDF Report Service, Groq Service
│   │   ├── config.py                    # Dynamic Settings & Environment Variables
│   │   └── main.py                      # Re-exporting app for Render Uvicorn
│   ├── .env.example                     # Backend environment template
│   ├── Dockerfile                       # Container definition for backend
│   ├── main.py                          # Primary FastAPI application entrypoint
│   └── requirements.txt                 # Backend Python package dependencies
│
├── frontend/                            # React + Vite Single Page Application
│   ├── public/
│   │   ├── _redirects                   # Render Static Site SPA rewrite rules
│   │   └── favicon.svg                  # Application branding icon
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, AICopilotModal, Badges
│   │   ├── context/                     # AuthContext with 1-click Demo Role Switcher
│   │   ├── layouts/                     # DashboardLayout with Responsive Navigation
│   │   ├── pages/                       # 14 Complete Feature Pages
│   │   │   ├── DashboardPage.jsx        # National Command Map & Overview KPIs
│   │   │   ├── MinesPage.jsx            # All Mines Table & Filter
│   │   │   ├── MineDetailPage.jsx       # Detailed Mine Telemetry & Dossier
│   │   │   ├── LiveSensorsPage.jsx      # Multi-Gas IoT Telemetry Stream (DEMO IoT STREAM)
│   │   │   ├── CompliancePage.jsx       # Statutory Regulations & Audits
│   │   │   ├── InspectionsPage.jsx      # Digital Inspection Management
│   │   │   ├── ViolationsPage.jsx       # Violation Registry & Notice Tracking
│   │   │   ├── CorrectiveActionsPage.jsx# CAPA Plans & Verification
│   │   │   ├── AlertsPage.jsx           # Hazard & Early Warning Alert Center
│   │   │   ├── ReportsPage.jsx          # Statutory Reports, In-Memory PDF & CSV Export
│   │   │   ├── DataSourcesPage.jsx      # Authoritative Public Datasets Catalog
│   │   │   ├── AuditLogsPage.jsx        # Tamper-Evident System Audit Trail
│   │   │   ├── SimulationPage.jsx       # 14-Step AI Simulation Runner
│   │   │   └── LoginPage.jsx            # User Authentication Portal
│   │   ├── services/                    # Axios API Service & Real-Time Poller
│   │   ├── App.jsx                      # Application Router Configuration
│   │   ├── index.css                    # Design System & Styling Tokens
│   │   └── main.jsx                     # Vite Application Mount Point
│   ├── .env.example                     # Frontend environment template
│   ├── index.html                       # HTML5 Root Document with SEO tags
│   ├── package.json                     # NPM Dependencies & Scripts
│   └── vite.config.js                   # Vite Build Configuration
│
├── database/                            # Database DDL & Seed Scripts
│   ├── schema.sql                       # Complete Relational Database Schema
│   └── seed.sql                         # Standard Seed Data with 10 Demo Mines
│
├── docs/                                # Technical Documentation & Blueprints
│   ├── ARCHITECTURE.md                  # Detailed Sequence Diagrams & Architecture
│   └── RENDER_DEPLOYMENT.md             # Comprehensive Step-by-Step Render Guide
│
├── .env.example                         # Root Environment Template
├── .gitignore                           # Git Ignore Rules (Protects secrets & builds)
├── init_db.py                           # Standalone Database Seeder Script
├── render.yaml                          # Render Infrastructure-as-Code Blueprint
├── requirements.txt                     # Root Python Requirements Reference
├── test_backend.py                      # 9-Suite End-to-End Automated Test Runner
└── README.md                            # Project Master Documentation
```

---

## 🚀 Render Deployment Information

CoalGuard AI is configured for one-click deployment using Render Blueprint (`render.yaml`) or manual service creation on the Render Dashboard.

### 1. Database: Render Managed PostgreSQL
* **Service Type**: PostgreSQL Database
* **Database Name**: `coalguard_ai`
* **User**: `coalguard_admin`
* **Connection String**: Render automatically exposes `DATABASE_URL`

### 2. Backend: Render Web Service
* **Runtime**: Python 3
* **Root Directory**: `backend`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Health Check Path**: `/health`

### 3. Frontend: Render Static Site
* **Runtime**: Static Site
* **Root Directory**: `frontend`
* **Build Command**: `npm install && npm run build`
* **Publish Directory**: `dist`
* **Routing Rewrite**: `/*` to `/index.html` (handled by `_redirects` and `render.yaml`)

### 4. AI: Groq Cloud LPU
* **Model**: `llama-3.3-70b-versatile`
* **Service**: High-throughput inference for safety copilots and dossier generation.

---

## 🔐 Environment Variables

| Component | Variable Name | Required | Description | Example (Placeholder Only) |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `VITE_API_URL` | Yes | URL of deployed Render Backend | `https://coalguard-api.onrender.com` |
| **Backend** | `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| **Backend** | `GROQ_API_KEY` | Optional | Groq Cloud API key for AI copilot | `gsk_your_groq_api_key` |
| **Backend** | `GROQ_MODEL` | No | Groq LLM model name | `llama-3.3-70b-versatile` |
| **Backend** | `JWT_SECRET` | Yes | Secret key for signing auth tokens | `your_secure_jwt_secret_token` |
| **Backend** | `FRONTEND_URL` | Yes | URL of deployed Render Frontend | `https://coalguard-frontend.onrender.com` |
| **Backend** | `ENVIRONMENT` | No | Runtime mode (`production`/`development`) | `production` |

> [!CAUTION]
> Never commit actual credentials, database passwords, or API keys to GitHub. Use `.env.example` as a template and enter production values in the Render Environment Variables dashboard.

---

## 💻 Local Development Setup

For local testing and offline development:

### 1. Clone & Set Up Backend
```bash
# Clone the repository
git clone https://github.com/<your-username>/ai-smart-coal-mine-governance.git
cd ai-smart-coal-mine-governance

# Install backend dependencies
pip install -r requirements.txt

# Initialize database with demo mines, telemetry, and rules
python init_db.py

# Run backend development server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Set Up Frontend
```bash
# Open a new terminal in the frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Run Automated Test Suite
```bash
python test_backend.py
```
Validates all 10 critical subsystems: Health checks, JWT auth across 4 roles, mine risk scoring, Isolation Forest anomaly ML, alerts, 14-step simulation, Reports module (6 types, in-memory ReportLab PDF, CSV), Groq AI fallback, and Authoritative Public Datasets & Data Provenance Standards.

---

## 🔑 Demo User Credentials

The application includes 4 pre-configured demo user accounts with varying statutory permissions:

| Role | Name | Email | Password | Scope of Authority |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | National Coal Controller | `admin@coalguard.gov.in` | `Admin@123` | Full national oversight, system administration, rule management |
| **GOVERNMENT_OFFICER** | Regional Mining Officer | `officer@coalguard.gov.in` | `Officer@123` | Regulatory enforcement, notice issuance, CAPA sign-off |
| **MINE_MANAGER** | General Manager | `manager@coalguard.gov.in` | `Manager@123` | Single colliery telemetry, sensor stream, evidence submission |
| **INSPECTOR** | Statutory Safety Auditor | `inspector@coalguard.gov.in` | `Inspector@123` | Conduct safety audits, execute 7-question digital checklists |

*(A 1-click Role Switcher is available in the top navigation bar for evaluator convenience).*

---

## 🔄 Demonstration Workflow (14-Step Closed Loop)

To observe CoalGuard AI's automated governance lifecycle, navigate to the **Simulation** tab and click **"Run AI Simulation"**:

```
Step 1:  Baseline IoT Ingestion (Normal CH4, CO, Dust levels)
   ↓
Step 2:  Hazard Surge Injected (Methane spikes above 3.5%, CO above 60 ppm)
   ↓
Step 3:  Isolation Forest ML flags severe multivariate anomaly
   ↓
Step 4:  AI Risk Engine escalates mine composite score to CRITICAL (>80.0)
   ↓
Step 5:  National Command Dashboard updates mine status with visual alert
   ↓
Step 6:  Automated Priority-1 Alert dispatched to DGMS Regional Officer
   ↓
Step 7:  Government Officer acknowledges hazard telemetry
   ↓
Step 8:  Emergency Statutory Inspection dispatched under CMR Section 153
   ↓
Step 9:  Inspector submits digital checklist (Fails ventilation check)
   ↓
Step 10: Formal Statutory Violation created with penalty points
   ↓
Step 11: Corrective Action Plan (CAPA) assigned to Mine Manager with 48h SLA
   ↓
Step 12: Mine Manager submits remediation report & ventilation logs
   ↓
Step 13: DGMS Officer reviews evidence and issues digital sign-off
   ↓
Step 14: Governance Loop Closed: Risk score drops to LOW (<30.0), compliance restored
```

---

## 🔮 Future Enhancements

* **Drone LiDAR & Thermal Vision**: Integration with autonomous UAV survey feeds for open-cast pit stability and coal stockpile spontaneous combustion detection.
* **Smart Wearable Integration**: Biometric and gas sensing bands for miners to track personal gas exposure and worker vitals.
* **Direct CIL ERP & SCADA Hooks**: Native connectors for existing Coal India Ltd (CIL) supervisory SCADA telemetry networks.
* **Multilingual Mobile App**: Offline-capable React Native application supporting Hindi, Bengali, Odia, and tribal dialects for frontline colliery workers.

---

## 📜 License & Acknowledgments

Developed for the **Smart India Hackathon 2026**.  
Built under statutory alignment with the **Coal Mines Regulations (CMR 2017)** and the **Directorate General of Mines Safety (DGMS)** guidelines.
