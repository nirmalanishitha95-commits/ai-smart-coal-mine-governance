import React, { useState, useEffect } from "react";
import {
  AlertTriangle, ShieldAlert, LifeBuoy, Users, Radio, MapPin,
  Activity, ArrowRight, CheckCircle2, Clock, X, Zap, Thermometer,
  Heart, AlertOctagon, RefreshCw, Check
} from "lucide-react";
import { workerService, rescueService } from "../services/api";

export default function WorkersInDangerSection({ onRescueTriggered }) {
  const [dangerWorkers, setDangerWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rescuingId, setRescuingId] = useState(null);
  const [rescueSuccessMsg, setRescueSuccessMsg] = useState("");

  const loadDangerWorkers = async () => {
    try {
      setLoading(true);
      const res = await workerService.getInDanger();
      if (res.data && res.data.length > 0) {
        setDangerWorkers(res.data);
      } else {
        // Fallback to all workers and filter
        const allRes = await workerService.getAll();
        const danger = (allRes.data || []).filter(
          (w) => w.safety_status === "EMERGENCY" || w.safety_status === "AT RISK" || w.safety_status === "WARNING"
        );
        setDangerWorkers(danger);
      }
    } catch (err) {
      console.error("Failed to load workers in danger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDangerWorkers();
  }, []);

  const handleStartRescue = (worker) => {
    setSelectedWorker(worker);
    setRescueSuccessMsg("");
  };

  const handleExecuteRescue = async (workerId) => {
    try {
      setRescuingId(workerId);
      const res = await workerService.startRescue(workerId, {
        notes: "Direct tactical evacuation dispatched from Safety Command Center."
      });
      setRescueSuccessMsg(`Rescue successfully executed! Miner has been safely extracted.`);
      
      // Update local item
      setDangerWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, safety_status: "RESCUED", status: "RESCUED", emergency_status: "RESCUED SAFELY" } : w))
      );
      if (selectedWorker && selectedWorker.id === workerId) {
        setSelectedWorker((prev) => ({
          ...prev,
          safety_status: "RESCUED",
          status: "RESCUED",
          emergency_status: "RESCUED SAFELY",
          rescue_status: "RESCUED"
        }));
      }
      if (onRescueTriggered) {
        onRescueTriggered();
      }
      setTimeout(() => {
        loadDangerWorkers();
      }, 2500);
    } catch (err) {
      console.error("Error executing rescue:", err);
      alert("Failed to execute rescue. Please verify network connection.");
    } finally {
      setRescuingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "EMERGENCY":
        return "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse";
      case "AT RISK":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "WARNING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "EVACUATED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "RESCUED":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-950 text-red-300 border-red-800";
      case "HIGH":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "MEDIUM":
        return "bg-yellow-950 text-yellow-300 border-yellow-800";
      default:
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
    }
  };

  const emergencyCount = dangerWorkers.filter((w) => w.safety_status === "EMERGENCY").length;
  const atRiskCount = dangerWorkers.filter((w) => w.safety_status === "AT RISK").length;
  const warningCount = dangerWorkers.filter((w) => w.safety_status === "WARNING").length;

  return (
    <section className="bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border-2 border-red-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden my-6">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-pulse">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide uppercase">
                Workers in Danger — Active Underground Safety Alert
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-500 text-white tracking-wider animate-pulse">
                PRIORITY 1 ACTION REQUIRED
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live miner positioning & physiological telemetry • Tagged as{" "}
              <span className="text-amber-400 font-mono font-medium">DEMO WORKER LOCATION</span>
            </p>
          </div>
        </div>

        {/* Status Counter Badges */}
        <div className="flex items-center gap-2">
          {emergencyCount > 0 && (
            <span className="px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white flex items-center gap-1.5 shadow-lg shadow-red-600/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              {emergencyCount} IN EMERGENCY
            </span>
          )}
          {atRiskCount > 0 && (
            <span className="px-3 py-1 text-xs font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {atRiskCount} AT RISK
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
              {warningCount} WARNING
            </span>
          )}
          <button
            onClick={loadDangerWorkers}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
            title="Refresh workers in danger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workers Grid / Cards */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
          Scanning underground zones for miners in danger...
        </div>
      ) : dangerWorkers.length === 0 ? (
        <div className="py-8 text-center bg-neutral-900/60 rounded-lg border border-neutral-800 mt-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-300">All Monitored Underground Miners are Currently Safe</p>
          <p className="text-xs text-neutral-400 mt-1">
            Atmospheric multi-gas telemetry within normal thresholds. All beacons reporting in nominal zones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {dangerWorkers.map((worker) => {
            const isEmergency = worker.safety_status === "EMERGENCY";
            const isAtRisk = worker.safety_status === "AT RISK";
            const isRescued = worker.safety_status === "RESCUED";

            return (
              <div
                key={worker.id}
                className={`bg-neutral-900/90 border rounded-xl p-4 transition-all duration-200 hover:border-neutral-600 relative flex flex-col justify-between ${
                  isEmergency
                    ? "border-red-500/50 shadow-lg shadow-red-950/50"
                    : isAtRisk
                    ? "border-amber-500/40"
                    : "border-neutral-800"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          {worker.worker_code}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            worker.safety_status
                          )}`}
                        >
                          {worker.safety_status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{worker.name}</h3>
                      <p className="text-xs text-neutral-400">{worker.role || "Underground Miner"}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskBadge(
                          worker.risk_level
                        )}`}
                      >
                        {worker.risk_level} RISK
                      </span>
                      <p className="text-[11px] font-mono text-red-400 mt-1">
                        Score: {worker.risk_score || 85}/100
                      </p>
                    </div>
                  </div>

                  {/* Colliery & Underground Zone */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-400">Mine:</span>
                      <span className="font-medium text-white text-right">{worker.mine_name}</span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-400">Underground Zone:</span>
                      <span className="font-semibold text-amber-300 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                        {worker.assigned_zone}
                      </span>
                    </div>

                    {/* Current Hazard */}
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20 text-neutral-300">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Current Hazard:</span>
                      </div>
                      <p className="text-xs text-red-200/90 leading-relaxed font-medium">
                        {worker.current_hazard}
                      </p>
                    </div>

                    {/* Vitals Telemetry */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex items-center gap-1.5 bg-neutral-800/60 p-1.5 rounded border border-neutral-700/50">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[11px] text-neutral-400">Heart Rate:</span>
                        <span className="font-mono text-[11px] text-white font-bold ml-auto">
                          {worker.heart_rate} bpm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-neutral-800/60 p-1.5 rounded border border-neutral-700/50">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[11px] text-neutral-400">Temp:</span>
                        <span className="font-mono text-[11px] text-white font-bold ml-auto">
                          {worker.body_temperature}°C
                        </span>
                      </div>
                    </div>

                    {/* Last Known Location */}
                    <div className="text-[11px] text-neutral-400 pt-1">
                      <div className="flex items-center gap-1 text-neutral-400 mb-0.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>Last Known Location:</span>
                      </div>
                      <p className="font-mono text-cyan-300/90 bg-cyan-950/30 p-1.5 rounded border border-cyan-800/20 text-[11px]">
                        {worker.last_known_location}
                      </p>
                    </div>

                    {/* Emergency Status */}
                    <div className="text-[11px] pt-1">
                      <span className="text-neutral-400">Emergency Status: </span>
                      <span className="font-bold text-red-400">{worker.emergency_status}</span>
                    </div>
                  </div>
                </div>

                {/* Rescue Action Button */}
                <div className="mt-4 pt-3 border-t border-neutral-800">
                  {isRescued ? (
                    <div className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      RESCUE COMPLETED
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartRescue(worker)}
                      className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                        isEmergency
                          ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-bounce"
                          : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                      }`}
                    >
                      <LifeBuoy className="w-4 h-4" />
                      <span>START RESCUE / RESCUE WORKER</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* RESCUE WORKFLOW MODAL                                    */}
      {/* ======================================================== */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border-2 border-red-500/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-900 p-5 border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
                  <LifeBuoy className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Underground Emergency Rescue Protocol
                    <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white font-mono">
                      {selectedWorker.worker_code}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Target: <span className="text-white font-semibold">{selectedWorker.name}</span> • Zone:{" "}
                    <span className="text-amber-300 font-semibold">{selectedWorker.assigned_zone}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorker(null)}
                className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Success Notification */}
              {rescueSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-sm">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{rescueSuccessMsg}</span>
                </div>
              )}

              {/* 1. Worker Details & Hazard Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700/60 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    1. Worker Details
                  </h4>
                  <div className="text-sm font-semibold text-white">{selectedWorker.name}</div>
                  <div className="text-xs text-neutral-300">
                    <span className="text-neutral-400">Role:</span> {selectedWorker.role}
                  </div>
                  <div className="text-xs text-neutral-300">
                    <span className="text-neutral-400">Colliery:</span> {selectedWorker.mine_name}
                  </div>
                  <div className="text-xs text-neutral-300">
                    <span className="text-neutral-400">Current Zone:</span>{" "}
                    <span className="text-amber-300 font-semibold">{selectedWorker.assigned_zone}</span>
                  </div>
                  <div className="text-xs text-cyan-300 pt-1 font-mono">
                    {selectedWorker.last_known_location}
                  </div>
                </div>

                <div className="bg-red-950/30 p-4 rounded-xl border border-red-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    2. Hazard Causing Danger & AI Risk
                  </h4>
                  <div className="text-xs text-red-200 font-semibold">
                    {selectedWorker.current_hazard}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="bg-red-900/40 px-2.5 py-1 rounded border border-red-700 text-center">
                      <div className="text-[10px] text-neutral-400">AI Risk Score</div>
                      <div className="text-lg font-bold font-mono text-red-400">
                        {selectedWorker.risk_score || 92.0} / 100
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-red-300">
                        Level: {selectedWorker.risk_level}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Affected workers in zone:{" "}
                        <span className="text-white font-bold">{selectedWorker.affected_workers_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Assigned Rescue Team & Equipment */}
              <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700/60">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    3. Assigned Rescue Squad
                  </h4>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                    STATUS: {selectedWorker.rescue_status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <div className="text-neutral-400">Squad Name:</div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {selectedWorker.assigned_rescue_team}
                    </div>
                    <div className="text-neutral-400 mt-1">
                      Rescue Leader:{" "}
                      <span className="text-cyan-300 font-semibold">
                        {selectedWorker.rescue_team_leader}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Specialization & Gear:</div>
                    <div className="text-neutral-200 mt-0.5">
                      {selectedWorker.rescue_team_specialization}
                    </div>
                    <div className="text-neutral-400 text-[11px] mt-1">
                      Equipped with 4-Hour Closed-Circuit SCBA & Thermal Search Quad
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. VISUAL RESCUE WORKFLOW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    End-to-End Rescue Workflow & Operation Timeline
                  </h4>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Step 5 of 7 Active
                  </span>
                </div>

                {/* Workflow Stepper */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                  {(selectedWorker.rescue_timeline || []).map((step, idx) => {
                    const isDone = step.status === "COMPLETED";
                    const isActive = step.status === "ACTIVE";

                    return (
                      <div key={idx} className="flex items-start gap-3 relative">
                        {/* Connecting Line */}
                        {idx < selectedWorker.rescue_timeline.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                              isDone ? "bg-emerald-500" : "bg-neutral-800"
                            }`}
                          />
                        )}

                        {/* Step Icon */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : isActive
                              ? "bg-red-600 text-white animate-pulse"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : step.step}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-bold tracking-wide ${
                                isDone
                                  ? "text-emerald-400"
                                  : isActive
                                  ? "text-red-400 font-extrabold"
                                  : "text-neutral-400"
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {step.time}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedWorker(null)}
                className="py-2.5 px-4 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-semibold transition"
              >
                Close Window
              </button>

              {selectedWorker.safety_status === "RESCUED" ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Worker Extracted and Rescued Safely
                </div>
              ) : (
                <button
                  disabled={rescuingId === selectedWorker.id}
                  onClick={() => handleExecuteRescue(selectedWorker.id)}
                  className="py-2.5 px-6 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition disabled:opacity-50"
                >
                  {rescuingId === selectedWorker.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Executing Extraction & Evacuation...
                    </>
                  ) : (
                    <>
                      <LifeBuoy className="w-4 h-4" />
                      EXECUTE RESCUE EXTRACTION NOW
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
