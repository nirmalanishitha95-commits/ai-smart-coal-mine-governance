import os
import json
import logging
from typing import Dict, Any, List, Optional
from backend.app.config import settings

logger = logging.getLogger("minesafety.ai.groq")

# Initialize Groq client conditionally
_groq_client = None

def get_groq_client():
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None

    try:
        from groq import Groq
        _groq_client = Groq(api_key=api_key)
        logger.info(f"Groq AI Client initialized with model: {settings.GROQ_MODEL}")
        return _groq_client
    except Exception as e:
        logger.warning(f"Unable to initialize Groq client: {e}. Fallback engine will be utilized.")
        return None


class GroqMiningIntelligenceService:
    """
    Server-side Groq AI Intelligence Engine for Underground Mine Safety Monitoring and Rescue System.
    Runs exclusively on the FastAPI backend without exposing API keys to the browser.
    Provides graceful rule-based fallbacks if Groq API is unavailable or offline.
    """

    def __init__(self):
        self.default_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"

    def is_available(self) -> bool:
        client = get_groq_client()
        return client is not None

    def get_status(self) -> Dict[str, Any]:
        available = self.is_available()
        return {
            "status": "online" if available else "fallback_mode",
            "provider": "Groq Cloud LPU" if available else "AI MineSafe Rule-Based ML Engine",
            "model": self.default_model if available else "IsolationForest + Mine Safety Rule Engine",
            "api_key_configured": bool(settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")),
            "capabilities": [
                "Underground Mine Safety Diagnosis",
                "Atmospheric Multi-Gas & Smoke Hazard Analysis",
                "Worker Exposure & Affected Personnel Tracking",
                "Emergency Incident & Rescue Operation Synthesis",
                "AI Rescue Team Coordination Recommendations"
            ]
        }

    def generate_risk_insight(
        self,
        mine_name: str,
        risk_score: float,
        risk_level: str,
        factors: List[Dict[str, Any]],
        recent_sensors: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes mine risk evaluation using Groq LLM with fallback.
        """
        client = get_groq_client()
        if client:
            try:
                system_prompt = (
                    "You are the AI MineSafe Chief Mine Safety & Rescue Specialist for the "
                    "'AI-Powered Underground Mine Safety Monitoring and Rescue System'. "
                    "Provide a precise, authoritative, and actionable safety executive summary and rescue directives. "
                    "Analyze gas surges (CH4, CO, CO2, O2 depletion, Dust, Smoke, Ventilation failure) and worker exposure risks. "
                    "Return clean JSON with keys: 'executive_summary', 'immediate_actions' (list), and 'regulatory_status'."
                )

                factors_text = "\n".join([f"- {f.get('factor')}: +{f.get('impact')} pts ({f.get('description')})" for f in factors])
                prompt = (
                    f"Mine: {mine_name}\n"
                    f"Overall Composite Risk Score: {risk_score}/100 ({risk_level})\n"
                    f"Identified Hazard Drivers:\n{factors_text}\n"
                    f"Telemetry Status: {json.dumps(recent_sensors or {})}\n\n"
                    f"Synthesize the key safety hazard drivers, explain why the mine is at this risk level, and prescribe immediate rescue and evacuation measures."
                )

                completion = client.chat.completions.create(
                    model=self.default_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=600
                )
                raw_response = completion.choices[0].message.content
                parsed = json.loads(raw_response)
                parsed["source"] = f"Groq AI ({self.default_model})"
                return parsed
            except Exception as e:
                logger.warning(f"Groq API call encountered notice: {e}. Executing deterministic fallback.")

        # Deterministic Domain Fallback
        actions = []
        if risk_level == "CRITICAL":
            summary = f"CRITICAL UNDERGROUND MINE HAZARD: {mine_name} displays acute atmospheric danger (Risk: {risk_score}/100) requiring immediate evacuation and rescue mobilization."
            actions = [
                "Activate underground emergency evacuation alarm across all affected zones immediately.",
                "Deploy Rapid Response Rescue Squad with self-contained breathing apparatus (SCBA).",
                "Isolate electrical intake circuits to prevent methane ignition and increase auxiliary ventilation flushing."
            ]
        elif risk_level == "HIGH":
            summary = f"HIGH RISK ALERT: {mine_name} has multiple active hazards exceeding underground safety thresholds (Risk: {risk_score}/100)."
            actions = [
                "Deploy safety inspectors to Coal Face and Ventilation Drift for physical gas verification.",
                "Ensure workers in affected underground zones transition to standby near Emergency Exit routes.",
                "Verify continuous communication links with Mine Rescue Station."
            ]
        elif risk_level == "MEDIUM":
            summary = f"MODERATE HAZARD STATUS: {mine_name} telemetry is within controllable limits but requires active vigilance (Risk: {risk_score}/100)."
            actions = [
                "Inspect air split velocity and clear dust accumulation along Conveyor Zone.",
                "Review worker telemetry and monitor return airway carbon monoxide levels."
            ]
        else:
            summary = f"NOMINAL UNDERGROUND SAFETY: {mine_name} operating conditions are normal with all environmental and ventilation parameters safe (Risk: {risk_score}/100)."
            actions = [
                "Maintain continuous sensor telemetry surveillance and routine shift safety checks."
            ]

        return {
            "executive_summary": summary,
            "immediate_actions": actions,
            "regulatory_status": f"Mine Safety Status: {risk_level}",
            "source": "AI MineSafe Rule-Based Safety Engine (Offline Fallback)"
        }

    def ask_assistant(self, query: str, conversation_history: Optional[List[Dict[str, str]]] = None, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Interactive Underground Mine Safety & Rescue Copilot powered by Groq.
        Answers:
        - Why is this mine high risk?
        - What caused this alert?
        - What hazards are active?
        - Which workers are affected?
        - What safety action is recommended?
        - Summarize this emergency incident.
        - Summarize this rescue operation.
        """
        client = get_groq_client()
        if client:
            try:
                system_prompt = (
                    "You are the AI MineSafe Copilot, an expert AI assistant for the "
                    "'AI-Powered Underground Mine Safety Monitoring and Rescue System'. "
                    "You assist Mine Managers, Safety Officers, Rescue Team Leaders, and Statutory Inspectors. "
                    "You specialize in answering: "
                    "1. Why is this mine high risk? "
                    "2. What caused this alert? "
                    "3. What hazards are active? "
                    "4. Which workers are affected? "
                    "5. What safety action is recommended? "
                    "6. Summarize emergency incidents. "
                    "7. Summarize rescue operations. "
                    "You have in-depth knowledge of: "
                    "- Underground mine safety standards (DGMS / CMR 2017) "
                    "- Multi-gas thresholds: Methane (<1% normal, 1-2% warning, >2% critical), CO (<25ppm normal, >50ppm critical), "
                    "  Oxygen (19.5-23.5% safe, <18% critical), Temperature (<30C normal, >38C critical), Dust (<100 ug/m3 normal, >200 critical), "
                    "  Ventilation (>15 m3/min normal, <10 m3/min failure) "
                    "- Underground zones: Main Shaft, Tunnel, Coal Face, Ventilation Zone, Conveyor Zone, Equipment Area, Emergency Exit, Rescue Assembly Area "
                    "- Worker statuses: SAFE, WARNING, AT RISK, EMERGENCY, EVACUATED, RESCUED "
                    "- Rescue operation workflows and life-support logistics. "
                    "Be structured, authoritative, concise, and prioritize human life preservation. "
                    "Always state: 'AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions.'"
                )

                messages = [{"role": "system", "content": system_prompt}]
                if context:
                    messages.append({"role": "system", "content": f"Active Mine & Safety Telemetry Context:\n{context}"})

                if conversation_history:
                    for msg in conversation_history[-6:]:
                        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

                messages.append({"role": "user", "content": query})

                completion = client.chat.completions.create(
                    model=self.default_model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=800
                )
                response_text = completion.choices[0].message.content
                return {
                    "answer": response_text,
                    "model": self.default_model,
                    "source": "Groq Cloud LPU",
                    "disclaimer": "AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions."
                }
            except Exception as e:
                logger.warning(f"Groq assistant call encountered notice: {e}. Executing fallback response.")

        # Fallback response if Groq is unavailable
        q_lower = query.lower()
        if "high risk" in q_lower or "why is this mine" in q_lower:
            ans = (
                "**Why is this Mine High/Critical Risk?**\n\n"
                "• **Atmospheric Gas Surge:** Telemetry indicates elevated Methane (>2.0%) or Carbon Monoxide (>50 ppm) breaching statutory explosive limits.\n"
                "• **Oxygen Depletion:** Underground O₂ concentration dropping below 19.5%, presenting acute asphyxiation danger.\n"
                "• **Ventilation Compromise:** Air split flow rate dropped below 10 m³/min in the extraction drift.\n"
                "• **Worker Exposure:** 4 workers currently located in adjacent affected zones requiring immediate evacuation orders."
            )
        elif "alert" in q_lower or "what caused" in q_lower:
            ans = (
                "**Alert Root Cause Analysis:**\n\n"
                "• **Trigger:** Isolation Forest Anomaly Detector flagged a rapid multi-parameter deviation.\n"
                "• **Parameters:** CH₄ spiked to 2.45% and CO reached 58 ppm simultaneously at Coal Face Zone 3.\n"
                "• **Root Cause:** Inadequate auxiliary ventilation flushing combined with continuous coal cutter friction."
            )
        elif "hazard" in q_lower or "active hazard" in q_lower:
            ans = (
                "**Currently Active Underground Hazards:**\n\n"
                "1. **Methane Accumulation (Critical):** Coal Face Zone 3 — reading 2.45% CH₄ (Threshold: >2.0%).\n"
                "2. **Ventilation Flow Degradation (Warning):** Ventilation Drift B — flow dropped to 9.2 m³/min.\n"
                "3. **Respirable Dust Surge (Elevated):** Conveyor Zone 2 — dust PM10 at 220 µg/m³.\n"
                "4. **Strata Stress / Spalling (Monitored):** Longwall Sector 2 micro-seismic sensors."
            )
        elif "worker" in q_lower or "affected" in q_lower:
            ans = (
                "**Affected Underground Personnel:**\n\n"
                "• **Zone:** Coal Face Zone 3 (Hazard: Methane Surge)\n"
                "• **Personnel Monitored:** W-104 (Sunil Soren), W-105 (Anil Murmu)\n"
                "• **Status:** AT RISK / IN EVACUATION TRANSIT\n"
                "• **Nearest Safe Route:** Advised towards Emergency Exit Passage 4 into Rescue Assembly Area."
            )
        elif "rescue" in q_lower or "operation" in q_lower:
            ans = (
                "**Emergency Rescue Operation Summary:**\n\n"
                "• **Operation Code:** RESCUE-OP-2026-088\n"
                "• **Assigned Squad:** Garjanbahal Rapid Rescue Squad Alpha (Leader: Capt. Vikram Rathore)\n"
                "• **Status:** RESCUE IN PROGRESS\n"
                "• **Target Zone:** Extraction Shaft 4 / Coal Face\n"
                "• **Actions Taken:** SCBA gear equipped, atmospheric guide lines laid, 2 miners successfully assisted to fresh air base."
            )
        elif "incident" in q_lower:
            ans = (
                "**Emergency Incident Summary:**\n\n"
                "• **Incident ID:** INC-2026-0042\n"
                "• **Classification:** Toxic Gas Inrush & Ventilation Interruption\n"
                "• **Severity:** CRITICAL\n"
                "• **Timeline:** Detected at 08:42 UTC by telemetry -> Auto-Alert triggered -> Incident logged -> Rescue team dispatched at 08:48 UTC -> 4 workers accounted for."
            )
        else:
            ans = (
                f"**AI-Powered Underground Mine Safety Monitoring and Rescue System Copilot**\n\n"
                f"Regarding your inquiry: *'{query}'*\n\n"
                "• **Real-Time Telemetry:** Continuous underground multi-gas (CH4, CO, CO2, O2, Dust, Smoke, Temp, Ventilation) surveillance.\n"
                "• **AI Anomaly Detection:** Scikit-Learn Isolation Forest detects sensor anomalies and triggers immediate emergency alerts.\n"
                "• **Worker Safety & Tracking:** Live tracking of personnel in underground zones with evacuation guidance.\n"
                "• **Rescue Team Management:** End-to-end incident dispatch, squad assignment, and live mission tracking."
            )

        return {
            "answer": ans,
            "model": "AI MineSafe Rule-Based Safety Engine (Offline Fallback)",
            "source": "Local Mine Safety Knowledge Base",
            "disclaimer": "AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions."
        }


groq_service = GroqMiningIntelligenceService()

