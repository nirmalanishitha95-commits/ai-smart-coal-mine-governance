import React, { useState } from "react";
import {
  Play, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert,
  FileCheck2, Activity, Cpu, RotateCcw, X, Sparkles
} from "lucide-react";
import { simulationService } from "../services/api";

export default function SimulationModal({ isOpen, onClose, onComplete, initialMineId }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulationData, setSimulationData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);

  if (!isOpen) return null;

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setError(null);
    setCurrentStepIndex(0);
    setSimulationData(null);
    setSelectedStep(null);

    try {
      const res = await simulationService.run(initialMineId || 1);
      const data = res.data;
      setSimulationData(data);

      for (let i = 0; i < data.steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        setCurrentStepIndex(i + 1);
        setSelectedStep(data.steps[i]);
      }
      setIsRunning(false);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      setError("Simulation failed to execute. Ensure backend server is running.");
      setIsRunning(false);
    }
  };

  const handleResetBaseline = async () => {
    try {
      await simulationService.reset(initialMineId || 1);
      setSimulationData(null);
      setCurrentStepIndex(0);
      setSelectedStep(null);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
    }
  };

  const activeSteps = simulationData?.steps || [];
  const progressPercent = activeSteps.length > 0 ? (currentStepIndex / activeSteps.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg bg-white border border-gray-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#F5F7FA]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[#1E5B3A] text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1F2937]">
                  AI Risk & Compliance Closed-Loop Simulation
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
                  SIH 2026 DEMO
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                14-Step End-to-End Governance: Sensor Surge → Anomaly ML → Risk Escalation → Alert → Inspection → Remediation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#1F2937] rounded-md hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1.5 overflow-hidden">
          <div
            className="h-full bg-[#1E5B3A] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
          {/* Left Column: 14 Steps List */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="text-xs font-semibold text-[#1F2937] uppercase tracking-wider">
                Workflow Trace ({currentStepIndex}/{simulationData?.steps?.length || 14} Executed)
              </span>
              {simulationData && (
                <span className="text-xs font-medium text-[#15803D] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ID: {simulationData.simulation_id}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {activeSteps.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg bg-[#F5F7FA]">
                  <Activity className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1F2937]">Ready to initiate AI Governance simulation</p>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
                    Click "Run Simulation" below to simulate an underground methane gas surge and trace the autonomous multi-role closed loop.
                  </p>
                </div>
              ) : (
                activeSteps.slice(0, currentStepIndex).map((step) => {
                  const isDone = true;
                  const isSelected = selectedStep?.step_number === step.step_number;

                  return (
                    <div
                      key={step.step_number}
                      onClick={() => setSelectedStep(step)}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? "bg-[#1E5B3A]/10 border-[#1E5B3A]"
                          : isDone
                          ? "bg-white border-gray-200 hover:bg-gray-50"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1E5B3A] text-white text-[10px] font-bold">
                            {step.step_number}
                          </span>
                          <span className="font-semibold text-xs text-[#1F2937]">
                            {step.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#4B5563]">
                          {step.actor}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 pl-7">
                        {step.action}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Step Inspector Details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="p-4 rounded-lg bg-[#F5F7FA] border border-gray-200 flex-1 space-y-3">
              <h3 className="card-title text-[#1F2937] border-b border-gray-200 pb-2">
                Step Execution Inspector
              </h3>

              {selectedStep ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#6B7280]">Executing Role:</span>
                    <p className="font-bold text-[#1E5B3A] mt-0.5">{selectedStep.actor}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Action Executed:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">{selectedStep.action}</p>
                  </div>
                  {selectedStep.details && (
                    <div>
                      <span className="text-[#6B7280]">Telemetry & System Context:</span>
                      <pre className="mt-1 p-2 rounded bg-white border border-gray-200 font-mono text-[11px] text-[#1F2937] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedStep.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedStep.risk_impact && (
                    <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                      <strong>AI Risk Score Impact:</strong> {selectedStep.risk_impact}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] py-12 text-center">
                  Select a workflow step on the left to inspect its live data payloads.
                </p>
              )}
            </div>

            {/* Error notice */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-[#DC2626]">
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleResetBaseline}
                className="btn-secondary text-xs"
                title="Reset database telemetry back to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Baseline</span>
              </button>

              <button
                onClick={handleStartSimulation}
                disabled={isRunning}
                className="btn-primary text-xs !bg-[#1E5B3A]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunning ? "Simulating Workflow..." : "Start 14-Step Simulation"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
