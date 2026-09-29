import os
import json
import logging
from typing import Dict, Any, List, Optional
from backend.app.config import settings

logger = logging.getLogger("coalguard.ai.groq")

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
    Server-side Groq AI Intelligence Engine for Coal Mine Compliance & Safety Governance.
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
            "provider": "Groq Cloud LPU" if available else "CoalGuard Rule-Based ML Engine",
            "model": self.default_model if available else "IsolationForest + DGMS Rule Engine",
            "api_key_configured": bool(settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")),
            "capabilities": [
                "DGMS Regulatory Compliance Synthesis",
                "Atmospheric Multi-Gas Hazard Diagnosis",
                "Automated Remediation Plan Generation",
                "Mine Safety Assistant & Copilot"
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
                    "You are the CoalGuard AI Senior Regulatory Officer and Mining Safety Specialist, "
                    "operating under the Ministry of Coal and Directorate General of Mines Safety (DGMS), Government of India. "
                    "Provide a precise, authoritative, and actionable safety executive summary. "
                    "Reference Coal Mines Regulations (CMR) 2017 standards where applicable. "
                    "Return clean JSON with keys: 'executive_summary', 'immediate_actions' (list), and 'regulatory_status'."
                )

                factors_text = "\n".join([f"- {f.get('factor')}: +{f.get('impact')} pts ({f.get('description')})" for f in factors])
                prompt = (
                    f"Mine: {mine_name}\n"
                    f"Overall Composite Risk Score: {risk_score}/100 ({risk_level})\n"
                    f"Identified Hazard Drivers:\n{factors_text}\n"
                    f"Telemetry Status: {json.dumps(recent_sensors or {})}\n\n"
                    f"Synthesize the key hazard escalation drivers and prescribe priority statutory interventions."
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
            summary = f"CRITICAL HAZARD SURGE: {mine_name} displays acute operational vulnerability requiring immediate DGMS intervention."
            actions = [
                "Issue Section 22 Emergency Stop-Work Notice on compromised mine sectors.",
                "Enforce complete atmospheric gas flushing and verify auxiliary ventilation intake.",
                "Deploy DGMS statutory inspection squad for on-site physical verification within 24 hours."
            ]
        elif risk_level == "HIGH":
            summary = f"ELEVATED RISK LEVEL: {mine_name} has multiple active hazard factors exceeding standard baseline tolerances."
            actions = [
                "Conduct mandatory calibration of underground multi-gas telemetry nodes.",
                "Expedite resolution of open high-severity violations prior to next production cycle.",
                "Review strata control and roof bolting logs with Mine Manager."
            ]
        elif risk_level == "MEDIUM":
            summary = f"MODERATE OPERATIONAL STATUS: {mine_name} is operating within controlled limits but requires proactive remediation of pending items."
            actions = [
                "Monitor return airway carbon monoxide and respirable dust levels.",
                "Close pending corrective actions within the assigned statutory timeframe."
            ]
        else:
            summary = f"NOMINAL COMPLIANCE: {mine_name} demonstrates healthy compliance scores with all key environmental thresholds satisfied."
            actions = [
                "Maintain continuous telemetry streaming and adhere to scheduled audit cycles."
            ]

        return {
            "executive_summary": summary,
            "immediate_actions": actions,
            "regulatory_status": f"DGMS Risk Class: {risk_level}",
            "source": "CoalGuard Rule-Based ML Engine (Offline Fallback)"
        }

    def ask_assistant(self, query: str, conversation_history: Optional[List[Dict[str, str]]] = None, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Interactive Mining Governance Copilot powered by Groq.
        """
        client = get_groq_client()
        if client:
            try:
                system_prompt = (
                    "You are CoalGuard Copilot, an AI Mining Governance & DGMS Statutory Compliance Assistant. "
                    "You assist Coal Mine Managers, Safety Officers, and DGMS Inspectors in India. "
                    "You have in-depth knowledge of: "
                    "- Coal Mines Regulations (CMR) 2017 & 1957 "
                    "- Mines Act 1952 statutory obligations "
                    "- DGMS Gas Thresholds (Methane < 1.0% normal, > 2.0% critical; CO < 25 ppm normal, > 50 ppm critical; Dust < 100 ug/m3) "
                    "- Safety Management Plans (SMP) & Emergency Preparedness "
                    "- Effluent & Acid Mine Drainage standards (MoEFCC pH 6.5 - 8.5) "
                    "Be professional, clear, concise, and structured with bullet points. "
                    "Always state that AI recommendations assist regulatory personnel and do not substitute statutory DGMS legal orders."
                )

                messages = [{"role": "system", "content": system_prompt}]
                if context:
                    messages.append({"role": "system", "content": f"Active Mine/System Context:\n{context}"})

                if conversation_history:
                    for msg in conversation_history[-6:]:
                        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

                messages.append({"role": "user", "content": query})

                completion = client.chat.completions.create(
                    model=self.default_model,
                    messages=messages,
                    temperature=0.4,
                    max_tokens=800
                )
                response_text = completion.choices[0].message.content
                return {
                    "answer": response_text,
                    "model": self.default_model,
                    "source": "Groq Cloud LPU",
                    "disclaimer": "AI-Assisted Governance Tool - Assists human officers in statutory compliance decision-making."
                }
            except Exception as e:
                logger.warning(f"Groq assistant call encountered notice: {e}. Executing fallback response.")

        # Fallback response if Groq is unavailable
        q_lower = query.lower()
        if "methane" in q_lower or "gas" in q_lower:
            ans = (
                "**Underground Atmospheric Gas Standards (DGMS / CMR 2017 Reg 153):**\n\n"
                "• **Normal Range:** < 1.0% volume in general body of air.\n"
                "• **Warning Level (1.0% - 2.0%):** Immediate inspection of auxiliary ventilation and air split velocities.\n"
                "• **Critical Level (> 2.0%):** Mandatory immediate power cutoff (flameproof electrical apparatus trip), withdrawal of all personnel from the return airway, and notification to DGMS.\n\n"
                "*Continuous telemetry from our DEMO IoT STREAM provides real-time detection via Scikit-Learn Isolation Forest.*"
            )
        elif "violation" in q_lower or "penalty" in q_lower:
            ans = (
                "**DGMS Statutory Violation Protocol:**\n\n"
                "1. **Inspection Finding:** Inspector records checklist non-compliance.\n"
                "2. **Violation Notice:** Formal notice issued under CMR 2017 with penalty severity (Low/Medium/High/Critical).\n"
                "3. **Corrective Action Plan:** Mine Manager has 48h to 15 days SLA to rectify and submit physical evidence.\n"
                "4. **Sign-off:** DGMS officer verifies telemetry and physical documentation before closing the violation."
            )
        elif "render" in q_lower or "deploy" in q_lower or "architecture" in q_lower:
            ans = (
                "**CoalGuard AI Render Deployment Architecture:**\n\n"
                "• **Frontend:** React + Vite on Render Static Site with SPA fallback rewrite.\n"
                "• **Backend:** FastAPI Web Service on Render (`0.0.0.0:$PORT`).\n"
                "• **Database:** Render Managed PostgreSQL connected via `DATABASE_URL`.\n"
                "• **AI Processing:** Server-side Isolation Forest Anomaly Detection + Groq Cloud LPU LLM.\n"
                "• **Telemetry:** Real-time DEMO IoT STREAM with auto-polling every 5-6 seconds."
            )
        else:
            ans = (
                f"**CoalGuard AI Safety Governance Copilot**\n\n"
                f"Regarding your query: *'{query}'*\n\n"
                "• **Statutory Framework:** All mining operations must adhere to Mines Act 1952 and Coal Mines Regulations (CMR) 2017.\n"
                "• **Multi-Gas Surveillance:** Methane, Carbon Monoxide, Respirable Dust, Temperature, and Effluent pH are actively monitored by the Central Governance Board.\n"
                "• **Automated Risk Engine:** Synthesizes compliance deficiencies, open violations, overdue actions, and sensor telemetry into a 0-100 composite risk index.\n\n"
                "*Note: Groq LLM API integration is active on the backend. Provide a valid `GROQ_API_KEY` on Render to enable free-form generative LLM intelligence.*"
            )

        return {
            "answer": ans,
            "model": "CoalGuard Rule-Based Knowledge Engine (Fallback)",
            "source": "Local System Knowledge Base",
            "disclaimer": "AI-Assisted Governance Tool - Assists human officers in statutory compliance decision-making."
        }


groq_service = GroqMiningIntelligenceService()
