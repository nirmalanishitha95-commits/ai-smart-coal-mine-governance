# CoalGuard AI - Complete Render Production Deployment Guide

**AI-Based Smart Governance and Compliance Monitoring System for Coal Mines**  
*National Coal Mining Governance & Compliance Portal*

---

## Production Deployment Architecture

```
User Browser (Desktop / Mobile / Inspection Tablet)
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│  Render Static Site: Frontend (React 18 + Vite)        │
│  URL: https://coalguard-frontend.onrender.com          │
│  • SPA Client-Side Routing (/* -> /index.html 200)     │
│  • Recharts & Tailwind/CSS Dashboard Analytics         │
│  • Real-time Telemetry Poller (every 6 seconds)        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST / WebSockets
                            ▼
┌────────────────────────────────────────────────────────┐
│  Render Web Service: Backend Engine (Python FastAPI)   │
│  URL: https://coalguard-api.onrender.com               │
│  Start Command: uvicorn app.main:app --host 0.0.0.0    │
│  • Scikit-Learn IsolationForest Anomaly Detector       │
│  • Rule-Based Multi-Factor Mine Risk Engine            │
│  • 14-Step Automated Governance Simulation Loop        │
│  • Automated Database Seeder on Startup                │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ Render PostgreSQL Database    │  │ Groq Cloud LPU (LLM Engine)   │
│ • 10 Demo Coal Mines          │  │ Model: llama-3.3-70b-versatile│
│ • 60 Statutory Records        │  │ • DGMS Regulatory Synthesis   │
│ • 35 Violations & Penalties   │  │ • Mine Hazard Diagnosis       │
│ • 28 Safety Inspections       │  │ • Interactive AI Copilot      │
│ • 1050 Sensor Stream Readings │  │ • Fallback to local ML if     │
│ • 32 Corrective Action Plans  │  │   API key is offline          │
│ • 55 Priority Alerts          │  └───────────────────────────────┘
└───────────────────────────────┘
```

---

## 1. Prerequisites

1. A **GitHub account** with access to push repositories.
2. A **Render account** (free tier is fully supported: [https://render.com](https://render.com)).
3. *(Optional)* A **Groq API Key** from [https://console.groq.com/keys](https://console.groq.com/keys) (app operates with graceful built-in rule-based fallback if omitted).

---

## 2. Step-by-Step Render Deployment

### Step 1: Push Code to GitHub
Ensure all your modified files are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: complete Render production deployment configuration"
git push origin main
```

---

### Step 2: Open Render Dashboard
1. Log in to [https://dashboard.render.com](https://dashboard.render.com).
2. Click the **"New +"** button in the top navigation bar.

---

### Step 3: Create Render PostgreSQL Database
1. In the **New +** dropdown, select **PostgreSQL**.
2. Fill in the database settings:
   - **Name:** `coalguard-postgres`
   - **Database:** `coalguard_ai`
   - **User:** `coalguard_admin`
   - **Region:** *Oregon (US West)* or nearest to you.
   - **Plan:** *Free*
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g., `postgres://coalguard_admin:...@dpg-xxxxxx-a/coalguard_ai`).
   *(Note: The CoalGuard backend code automatically normalizes `postgres://` to `postgresql://` for SQLAlchemy/psycopg2).*

---

### Step 4: Deploy FastAPI Backend Web Service
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the Web Service settings:
   - **Name:** `coalguard-api`
   - **Language:** `Python`
   - **Region:** Same region as PostgreSQL (*Oregon*).
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
   - **Plan:** *Free*

4. Scroll down to **Environment Variables** and add:

| Key | Value / Source |
| :--- | :--- |
| `DATABASE_URL` | *Paste your Render PostgreSQL connection string* |
| `FRONTEND_URL` | `https://coalguard-frontend.onrender.com` *(Update with your actual frontend URL once created)* |
| `JWT_SECRET` | *Click 'Generate' or enter a secure random string* |
| `GROQ_API_KEY` | *Your Groq API Key (e.g., `gsk_...`)* |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `ENVIRONMENT` | `production` |

5. Click **Create Web Service**.
6. Wait 1–2 minutes for the backend build to finish. Once live, Render provides your public URL:
   `https://coalguard-api.onrender.com`

---

### Step 5: Deploy React + Vite Frontend Static Site
1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect the same GitHub repository.
3. Configure the Static Site settings:
   - **Name:** `coalguard-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Scroll to **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://coalguard-api.onrender.com` *(Your Backend Web Service URL)* |

5. Scroll to **Redirects/Rewrites** and verify:
   - The repository includes `frontend/public/_redirects` which auto-configures:
     ```
     /*    /index.html   200
     ```
   - Alternatively, add an explicit rewrite rule:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`

6. Click **Create Static Site**.
7. Wait ~1 minute for the build to finish. Your public frontend URL is live:
   `https://coalguard-frontend.onrender.com`

---

### Step 6: Verify Backend CORS Configuration
1. Return to the **coalguard-api** Web Service in Render.
2. Under **Environment Variables**, ensure `FRONTEND_URL` exactly matches your public Static Site URL:
   `FRONTEND_URL=https://coalguard-frontend.onrender.com`
3. Click **Save Changes**. Render will automatically redeploy the backend with updated CORS authorization.

---

### Step 7: Database Initialization & Seeding Verification
The CoalGuard AI backend automatically initializes tables and seeds all demo data on initial startup lifespan!

To verify or force a re-seed via Render Shell or local console:
```bash
python init_db.py
```
Output:
```
============================================================
CoalGuard AI - Render Database Initialization
============================================================
Target Database: postgresql://coalguard_admin:****@.../coalguard_ai
Creating all database tables via SQLAlchemy metadata...
Database tables created successfully.
Synchronizing seed dataset...
------------------------------------------------------------
PRODUCTION SEED VERIFICATION SUMMARY:
  • Demo Monitored Mines   : 10 (Requirement: >= 10)
  • Compliance Records     : 60 (Requirement: >= 50)
  • Statutory Violations   : 35 (Requirement: >= 30)
  • Safety Inspections     : 28 (Requirement: >= 25)
  • Sensor Readings        : 1050 (Requirement: >= 1000, Data Source: DEMO IoT STREAM)
  • Corrective Actions     : 32 (Requirement: >= 30)
  • System Alerts          : 55 (Requirement: >= 50)
  • Pre-configured Users   : 4 (4 Statutory Roles)
------------------------------------------------------------
>>> DATABASE INITIALIZATION COMPLETED SUCCESSFULLY! <<<
============================================================
```

---

## 3. Alternative: One-Click Render Blueprint Deployment (`render.yaml`)

If using Render Blueprints:
1. In Render Dashboard, click **New +** → **Blueprint**.
2. Connect your GitHub repository.
3. Render automatically detects the root [`render.yaml`](file:///c:/Users/nirma/.gemini/antigravity-ide/scratch/coalguard-ai/render.yaml).
4. Provide your `GROQ_API_KEY` when prompted.
5. Click **Apply**. Render will automatically provision:
   - PostgreSQL database (`coalguard-postgres`)
   - FastAPI Web Service (`coalguard-api`)
   - React Static Site (`coalguard-frontend`)

---

## 4. Production Testing Checklist

Open your public Render URL: `https://coalguard-frontend.onrender.com`

| # | Check Item | Test Procedure | Expected Result |
| :---: | :--- | :--- | :--- |
| 1 | **Health Endpoint** | Visit `https://coalguard-api.onrender.com/health` | Returns `{"status": "healthy", "service": "CoalGuard AI"}` |
| 2 | **API Documentation** | Visit `https://coalguard-api.onrender.com/docs` | Interactive Swagger UI displays all endpoints |
| 3 | **Authentication** | Log in with `admin@coalguard.gov.in` / `Admin@123` | Redirects to `/dashboard` with valid JWT token |
| 4 | **Role Switching** | Click "Role" in Navbar → select "INSPECTOR" | UI switches permissions and navigation items |
| 5 | **Real-Time Monitoring** | Observe dashboard table | Status displays `● LIVE`, `Data Source: DEMO IoT STREAM`, updates every 6s |
| 6 | **SPA Refresh** | Refresh `/dashboard`, `/mines`, `/compliance` | Page refreshes cleanly without 404 error |
| 7 | **AI Simulation** | Click "Run AI Simulation" in Navbar → "Run Simulation" | Completes full 14-step loop from anomaly surge to sign-off |
| 8 | **Groq AI Copilot** | Click "AI Copilot" in Navbar → ask a question | Groq LLM streams statutory guidance on the Render backend |
| 9 | **CSV Export** | Visit `/reports` → click "Download CSV Dossier" | Browser downloads compliance report CSV without localhost URLs |
| 10 | **Logout** | Click User Avatar → "Sign Out" | Clears session and returns cleanly to `/login` |

---

## 5. Demo Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **National Coal Controller** | `admin@coalguard.gov.in` | `Admin@123` | Full statutory governance and administrative oversight |
| **DGMS Regional Mining Officer** | `officer@coalguard.gov.in` | `Officer@123` | Regulatory enforcement, notices & inspection sign-off |
| **Mine General Manager** | `manager@coalguard.gov.in` | `Manager@123` | Colliery operations, telemetry & evidence submission |
| **Statutory Safety Inspector** | `inspector@coalguard.gov.in` | `Inspector@123` | On-site digital checklists & violation issuance |
