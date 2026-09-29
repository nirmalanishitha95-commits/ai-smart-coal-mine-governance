# CoalGuard AI

### AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
> **National Coal Mining Governance & Compliance Portal**  
> *“AI-powered compliance, safety and environmental monitoring for smarter and safer coal mining.”*

---

## 🌐 Production Demo: Hosted on Render

The official, production version of this project is fully deployed and accessible on the public cloud:

* **Production Frontend URL (Live React Portal):**  
  [https://coalguard-frontend.onrender.com](https://coalguard-frontend.onrender.com)  
  *(Placeholder for evaluator deployment: `https://__________.onrender.com`)*

* **Production Backend URL (FastAPI REST API & Swagger Docs):**  
  [https://coalguard-api.onrender.com](https://coalguard-api.onrender.com)  
  *(Swagger API Documentation: `https://coalguard-api.onrender.com/docs`)*  
  *(Health Check: `https://coalguard-api.onrender.com/health`)*  
  *(Placeholder for evaluator deployment: `https://__________.onrender.com`)*

* **Database Engine:** Render Managed PostgreSQL (`coalguard_ai`)
* **AI Engine:** Groq Cloud LPU (`llama-3.3-70b-versatile`) + Scikit-Learn Isolation Forest

> [!IMPORTANT]
> **Faculty & Evaluator Notice**: The final project is executed and demonstrated directly on the public **Render** cloud. No local machine or localhost installation is required to evaluate the complete application.

---

## 📌 Project Overview

**CoalGuard AI** is an enterprise-grade digital governance platform engineered for the **Ministry of Coal**, the **Directorate General of Mines Safety (DGMS)**, and mine operators. It bridges statutory compliance, real-time IoT multi-gas telemetry, and machine learning surveillance to proactively prevent disasters, track regulatory violations, and streamline remedial action plans.

> [!NOTE]
> **AI-Assisted Risk Assessment**: In accordance with regulatory standards, all AI outputs serve as explainable decision-support for authorized inspectors and officers. Final legal compliance determinations remain under statutory officer purview. Multi-parameter atmospheric telemetry is generated via the backend DEMO IoT STREAM for prototype evaluation.

---

## 🏛️ Render Production Architecture

```
User Browser (Desktop / Mobile / Tablet)
                 │
                 ▼
Render Static Site (React 18 + Vite) ── [VITE_API_URL]
                 │
                 ▼
Render Web Service (FastAPI 0.110.0) ── [0.0.0.0:$PORT]
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
Render PostgreSQL       Groq API
(10 Demo Mines,         (LLM Safety Copilot &
 1050 Sensor Readings,   Executive Synthesis)
 60 Compliance Records)
```

---

## 🔑 Demo Access Credentials

The deployed Render application includes pre-configured accounts representing the four statutory mining roles:

| Role | Email | Password | Primary Governance Function |
| :--- | :--- | :--- | :--- |
| **National Coal Controller** | `admin@coalguard.gov.in` | `Admin@123` | Full statutory governance and administrative oversight |
| **DGMS Regional Mining Officer** | `officer@coalguard.gov.in` | `Officer@123` | Regulatory enforcement, notices & inspection sign-off |
| **Mine General Manager** | `manager@coalguard.gov.in` | `Manager@123` | Colliery operations, telemetry & evidence submission |
| **Statutory Safety Inspector** | `inspector@coalguard.gov.in` | `Inspector@123` | On-site digital checklists & violation issuance |

---

## 🛠 Technology Stack

### Frontend (Render Static Site)
* **Core**: React.js 18/19 + Vite 8 (Pure Vanilla CSS / Tailwind Design System)
* **Routing**: React Router v7 with Render SPA rewrite fallback (`_redirects`)
* **Data Visualization**: Recharts (6 dynamic telemetry charts)
* **GIS Mapping**: Leaflet + OpenStreetMap + React Leaflet
* **HTTP Client**: Axios with JWT Bearer Interceptors & dynamic `VITE_API_URL`
* **Real-time Telemetry**: Auto-polling every 6 seconds from Render backend

### Backend & AI (Render Web Service)
* **Framework**: Python 3.11/3.14 + FastAPI (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
* **ORM & Database**: SQLAlchemy 2.0 + Render Managed PostgreSQL (`psycopg2-binary`)
* **Generative AI**: Groq Cloud LPU (`llama-3.3-70b-versatile`)
* **Machine Learning**: Scikit-Learn Isolation Forest (100 estimators)
* **Security & Auth**: JWT (PyJWT) + Passlib PBKDF2 HMAC SHA-256

---

## 📖 Deployment Instructions

Detailed step-by-step instructions for deploying to Render are documented in:  
👉 [`docs/RENDER_DEPLOYMENT.md`](docs/RENDER_DEPLOYMENT.md)

---

## 💻 Optional Local Development / Debugging Environment

*(Only for developers modifying the codebase locally; the primary demonstration is hosted on Render)*

```bash
# 1. Initialize local database
python init_db.py

# 2. Run backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# 3. Run frontend
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo User Credentials

The database is pre-seeded with 4 distinct roles for comprehensive SIH evaluation:

| Role | Designation | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER ADMIN** | Coal Controller of India | `admin@coalguard.gov.in` | `Admin@123` | Full system access, all mines, rules, audit logs |
| **GOVT OFFICER** | Regional Mining Officer (DGMS) | `officer@coalguard.gov.in` | `Officer@123` | Inspections, violations, verification sign-off |
| **MINE MANAGER** | General Manager (Operations) | `manager@coalguard.gov.in` | `Manager@123` | Mine telemetry, upload remediation evidence |
| **INSPECTOR** | Statutory Safety Auditor | `inspector@coalguard.gov.in` | `Inspector@123` | Conduct inspections, 7-question digital checklist |

*(A quick 1-click role switcher is built directly into the top navigation bar for seamless demo navigation).*

---

## 🔄 The 14-Step AI Closed-Loop Workflow (SIH Presentation)

Click the **“RUN AI RISK SIMULATION”** button from the top navigation bar or the dashboard to observe the autonomous multi-role governance loop:

```text
1. Baseline Telemetry Ingestion (Methane 0.42%, CO 9.5 ppm, Dust 48 µg/m³)
   ↓
2. Hazard Surge Simulated (Methane spikes to 3.75%, CO to 64 ppm in Shaft 4)
   ↓
3. Scikit-Learn Isolation Forest classifies observation as CRITICAL ANOMALY
   ↓
4. AI Risk Engine recalculates composite mine score (Spikes from 42.0 to 84.0)
   ↓
5. Mine Status escalated to CRITICAL on National Command Board
   ↓
6. Priority 1 Alert generated & broadcasted to District Mining Officer
   ↓
7. Government Officer reviews alert telemetry and acknowledges triage
   ↓
8. Emergency Safety Inspection dispatched under statutory order
   ↓
9. Inspector completes digital checklist (Fails Q3: Ventilation Operational)
   ↓
10. Formal Regulatory Violation issued under Coal Mines Regulations Sec 153
   ↓
11. Mandatory Corrective Action Plan (CAPA) assigned with 48-hour SLA
   ↓
12. Mine Manager submits flameproof equipment certificate and airflow logs
   ↓
13. Government Officer conducts digital verification & approves sign-off
   ↓
14. Governance Loop Closed: Risk drops to 22.0 (LOW), compliance restored, audit log committed
```

---

## 🌐 Cloud Deployment Instructions

### Frontend on Vercel
1. Link your GitHub repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Configure Environment Variable:
   ```env
   VITE_API_URL=https://your-render-backend.onrender.com/api
   ```
5. Deploy!

### Backend on Render
1. Create a new **Web Service** on Render pointing to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to `Python 3`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables:
   ```env
   DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/coalguard_ai
   JWT_SECRET=coalguard-production-super-secret-key-sih-2026-secure
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```
7. Deploy!

---

## 📂 Project Structure

```text
coalguard-ai/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── anomaly_detector.py      # Isolation Forest Anomaly ML
│   │   │   ├── risk_engine.py           # Explainable Rule-Based Scoring
│   │   │   └── simulation_service.py    # 14-Step Workflow Automation
│   │   ├── api/                         # 13 REST API Endpoint Modules
│   │   ├── database/                    # SQLAlchemy Engine & Sessions
│   │   ├── models/                      # 17 Normalized Database Models
│   │   ├── schemas/                     # Pydantic Request/Response Models
│   │   └── services/                    # Auth, Audit, & DB Seed Services
│   ├── Dockerfile
│   ├── main.py                          # FastAPI App Entrypoint
│   └── requirements.txt
├── database/
│   ├── schema.sql                       # MySQL 8.0 DDL Script
│   └── seed.sql                         # MySQL 8.0 DML Seed Script
├── docs/
│   └── ARCHITECTURE.md                  # Detailed Architecture & Sequence Diagrams
├── frontend/
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, Badges, Modals
│   │   ├── context/                     # AuthContext & Demo Role Switcher
│   │   ├── layouts/                     # DashboardLayout
│   │   ├── pages/                       # 13 Complete Working Pages
│   │   ├── services/                    # Axios API Client
│   │   ├── App.jsx                      # Routing
│   │   ├── index.css                    # Tailwind CSS Theme
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🏆 Smart India Hackathon 2026 Highlights

* **100% Real Working System**: Connected backend APIs, normalized database, real JWT authentication, and interactive front-end.
* **Explainable AI**: Transparent factor breakdown for every risk score (+25 Gas Anomaly, +20 Violations, +15 Overdue Actions).
* **Live Telemetry ML**: Real Isolation Forest model trained on multi-sensor mining baseline data.
* **Digital 7-Question Checklist**: Automatic violation generation when statutory safety checks fail.
* **Resilient Infrastructure**: Connects out of the box with zero setup hurdles.
