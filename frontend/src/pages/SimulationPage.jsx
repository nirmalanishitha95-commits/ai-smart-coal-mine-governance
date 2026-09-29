import React, { useState, useEffect } from "react";
import {
  Cpu, Play, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck,
  Flame, FileCheck2, ArrowRight, Building, Sparkles
} from "lucide-react";
import { simulationService, mineService } from "../services/api";

export default function SimulationPage() {
  const [mines, setMines] = useState([]);
  const [selectedMineId, setSelectedMineId] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulationData, setSimulationData] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    mineService.getAll({ limit: 50 }).then((res) => {
      setMines(res.data);
      if (res.data.length > 0) setSelectedMineId(res.data[0].id);
    });
  }, []);

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setError(null);
    setCurrentStepIndex(0);
    setSimulationData(null);
    setSelectedStep(null);

    try {
      const res = await simulationService.run(selectedMineId);
      const data = res.data;
      setSimulationData(data);

      for (let i = 0; i < data.steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        setCurrentStepIndex(i + 1);
        setSelectedStep(data.steps[i]);
      }
      setIsRunning(false);
    } catch (err) {
      console.error(err);
      setError("Simulation failed to execute. Ensure backend server is running.");
      setIsRunning(false);
    }
  };

  const handleResetBaseline = async () => {
    try {
      await simulationService.reset(selectedMineId);
      setSimulationData(null);
      setCurrentStepIndex(0);
      setSelectedStep(null);
    } catch (err) {
      console.error(err);
    }
  };

  const activeSteps = simulationData?.steps || [];
  const progressPercent = activeSteps.length > 0 ? (currentStepIndex / activeSteps.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              AI Closed-Loop Risk & Compliance Studio
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
              SIH 2026 WORKFLOW
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Trace the 14-step statutory closed-loop from telemetry hazard surge through Isolation Forest classification to verified sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
          >
            {mines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <button onClick={handleResetBaseline} className="btn-secondary text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleStartSimulation}
            disabled={isRunning}
            className="btn-primary text-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? "Simulating..." : "Execute 14-Step Flow"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1E5B3A] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Grid: Steps on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65%: Steps Trace */}
        <div className="lg:col-span-7 gov-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="card-title text-[#1F2937]">Workflow Execution Steps</span>
            <span className="text-xs font-semibold text-[#6B7280]">
              {currentStepIndex} of {activeSteps.length || 14} Completed
            </span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {activeSteps.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#6B7280]">
                Click "Execute 14-Step Flow" above to trigger autonomous governance simulation.
              </div>
            ) : (
              activeSteps.slice(0, currentStepIndex).map((step) => {
                const isSelected = selectedStep?.step_number === step.step_number;

                return (
                  <div
                    key={step.step_number}
                    onClick={() => setSelectedStep(step)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "bg-[#1E5B3A]/10 border-[#1E5B3A]"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
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

        {/* Right 35%: Step Details Inspector */}
        <div className="lg:col-span-5 gov-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="card-title text-[#1F2937] border-b border-gray-100 pb-2">
              Step Context & Telemetry Payload
            </h3>

            {selectedStep ? (
              <div className="space-y-3 text-xs mt-3">
                <div>
                  <span className="text-[#6B7280]">Executing Role:</span>
                  <p className="font-bold text-[#1E5B3A] mt-0.5">{selectedStep.actor}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Regulatory Step Action:</span>
                  <p className="font-semibold text-[#1F2937] mt-0.5">{selectedStep.action}</p>
                </div>
                {selectedStep.details && (
                  <div>
                    <span className="text-[#6B7280]">Telemetry & Database State:</span>
                    <pre className="mt-1 p-2.5 rounded bg-[#F5F7FA] border border-gray-200 font-mono text-[11px] text-[#1F2937] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedStep.details, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedStep.risk_impact && (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                    <strong>AI Composite Risk Score Impact:</strong> {selectedStep.risk_impact}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-[#6B7280]">
                Select any executed step to inspect regulatory details.
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-[#DC2626] rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
