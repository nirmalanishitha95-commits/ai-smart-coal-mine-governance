from fastapi import APIRouter
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .mines import router as mines_router
from .compliance import router as compliance_router
from .violations import router as violations_router
from .corrective_actions import router as ca_router
from .inspections import router as inspections_router
from .sensors import router as sensors_router
from .alerts import router as alerts_router
from .analytics import router as analytics_router
from .reports import router as reports_router
from .audit import router as audit_router
from .simulation import router as simulation_router
from .ai import router as ai_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(mines_router)
api_router.include_router(compliance_router)
api_router.include_router(violations_router)
api_router.include_router(ca_router)
api_router.include_router(inspections_router)
api_router.include_router(sensors_router)
api_router.include_router(alerts_router)
api_router.include_router(analytics_router)
api_router.include_router(reports_router)
api_router.include_router(audit_router)
api_router.include_router(simulation_router)
api_router.include_router(ai_router)
