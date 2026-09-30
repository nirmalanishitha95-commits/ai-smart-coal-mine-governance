import os
import sys
from datetime import datetime, timezone
from contextlib import asynccontextmanager

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

# Ensure both repository root and backend directory are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
for p in [ROOT_DIR, CURRENT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.services.seed_service import seed_database_if_empty
from backend.app.services.sensor_stream_service import run_sensor_simulation_loop
from backend.app.api import api_router
from backend.app.api.sensors import websocket_sensors_endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure all tables exist & auto-seed realistic database for Render PostgreSQL
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database_if_empty(db)
        finally:
            db.close()
        print("Database schema verified and initial demo datasets synchronized.")
    except Exception as e:
        print(f"Database initialization notice: {e}")

    # Launch automated background real-time IoT sensor simulation loop
    sensor_stream_task = asyncio.create_task(run_sensor_simulation_loop())

    yield

    # Shutdown
    sensor_stream_task.cancel()
    try:
        await sensor_stream_task
    except asyncio.CancelledError:
        pass
    print("CoalGuard AI backend engine gracefully shutting down.")

app = FastAPI(
    title="CoalGuard AI - Smart Governance and Compliance Monitoring System for Coal Mines",
    description="AI-powered compliance, safety, and environmental monitoring for smarter and safer coal mining.",
    version="1.0.0 (Render Production)",
    lifespan=lifespan
)

# CORS configuration - dynamically binds FRONTEND_URL and allows all Render subdomains
allow_origins = settings.cors_origin_list
print(f"Configured CORS origins: {allow_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https?://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)

@app.websocket("/api/ws/sensors")
@app.websocket("/api/realtime")
@app.websocket("/ws")
async def ws_sensors_route(websocket: WebSocket):
    await websocket_sensors_endpoint(websocket)

@app.get("/")
def root():
    return {
        "project": "CoalGuard AI",
        "title": "AI-Based Smart Governance and Compliance Monitoring System for Coal Mines",
        "tagline": "AI-powered compliance, safety and environmental monitoring for smarter and safer coal mining.",
        "deployment": "Render Production Cloud",
        "status": "OPERATIONAL",
        "api_docs": "/docs",
        "health_check": "/health",
        "disclaimer": "AI-Assisted Risk Assessment - AI assists regulatory officers and does not make final legal decisions."
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint for Render Web Service monitoring.
    Matches requirement: {"status": "healthy", "service": "CoalGuard AI"}.
    """
    groq_active = bool(settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY"))
    return {
        "status": "healthy",
        "service": "CoalGuard AI",
        "ai_engine": "IsolationForest (Online)",
        "groq_status": "Enabled (LPU Online)" if groq_active else "Fallback (Deterministic DGMS Engine)",
        "database": "Connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
