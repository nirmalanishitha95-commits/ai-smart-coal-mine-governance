from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class SimulationStep(BaseModel):
    step_number: int
    title: str
    status: str # PENDING, IN_PROGRESS, COMPLETED, FAILED
    actor: str # System / Sensor / AI Engine / Officer / Inspector / Mine Manager
    description: str
    data_snapshot: Optional[Dict[str, Any]] = None

class SimulationRunRequest(BaseModel):
    mine_id: Optional[int] = None
    sensor_anomaly_type: Optional[str] = "METHANE" # METHANE, CO, DUST

class SimulationStateResponse(BaseModel):
    simulation_id: str
    mine_id: int
    mine_name: str
    current_step: int
    is_completed: bool
    steps: List[SimulationStep]
    final_summary: Optional[Dict[str, Any]] = None
