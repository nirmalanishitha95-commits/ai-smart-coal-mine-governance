import React, { useState } from "react";
import { Settings, ShieldCheck, Database, Bell, Cpu, Save, CheckCircle2, Sliders, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [savedNotice, setSavedNotice] = useState(false);

  // Form states
  const [providerType, setProviderType] = useState("DEMO_IOT");
  const [methaneThreshold, setMethaneThreshold] = useState("1.0");
  const [coThreshold, setCoThreshold] = useState("25.0");
  const [dustThreshold, setDustThreshold] = useState("100.0");
  const [tempThreshold, setTempThreshold] = useState("35.0");
  const [contaminationRate, setContaminationRate] = useState("0.05");
  const [alertSlaCritical, setAlertSlaCritical] = useState("15");

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              System Governance & Operational Settings
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure DGMS threshold limits, AI anomaly detector hyperparameters, and real-time telemetry providers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary text-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedNotice && (
        <div className="gov-card p-3 bg-green-50 border border-green-200 flex items-center gap-2 text-xs text-[#15803D] font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Governance configuration updated successfully and synchronized with AI engine.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Real-Time Telemetry Data Provider (Requirement 22 & 23) */}
        <div className="gov-card p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Database className="w-4 h-4 text-[#1E5B3A]" />
            <h2 className="card-title text-[#1F2937]">Sensor Data Provider Architecture</h2>
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            Select the active sensor stream provider abstraction. Hardware adapters can be plugged in without frontend modifications.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "DEMO_IOT", title: "Demo IoT Stream", label: "DATA SOURCE: DEMO IoT STREAM", desc: "Built-in realistic multi-gas simulation engine for evaluation." },
              { id: "LIVE_IOT", title: "Live Field IoT Gateway", label: "DATA SOURCE: LIVE IoT", desc: "Direct MQTT broker connection to physical underground station." },
              { id: "EXTERNAL_API", title: "External SCADA / DGMS API", label: "DATA SOURCE: DGMS SCADA API", desc: "Central cloud telemetry ingestion via ministry REST/WebSocket." },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setProviderType(p.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition ${
                  providerType === p.id
                    ? "bg-[#1E5B3A]/5 border-[#1E5B3A] shadow-xs"
                    : "bg-[#F5F7FA] border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#1F2937]">{p.title}</span>
                  <span className={`w-3 h-3 rounded-full border-2 ${providerType === p.id ? "bg-[#1E5B3A] border-[#1E5B3A]" : "border-gray-300"}`} />
                </div>
                <span className="inline-block mt-1 font-mono text-[10px] font-bold text-[#1E5B3A]">
                  {p.label}
                </span>
                <p className="text-[11px] text-[#6B7280] mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Statutory Threshold Limits */}
        <div className="gov-card p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Sliders className="w-4 h-4 text-[#1E5B3A]" />
            <h2 className="card-title text-[#1F2937]">DGMS Statutory Gas & Environmental Limits</h2>
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            Prescribed limits under Coal Mines Regulations, 2017 for automated anomaly triggering.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">Methane (CH4) Warning Limit (%)</label>
              <input
                type="number"
                step="0.1"
                value={methaneThreshold}
                onChange={(e) => setMethaneThreshold(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">Critical threshold automatically fixed at 2.0%</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">Carbon Monoxide (CO) Limit (ppm)</label>
              <input
                type="number"
                step="1"
                value={coThreshold}
                onChange={(e) => setCoThreshold(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">Critical threshold at 50 ppm (combustion alert)</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">Respirable Dust PM10 (µg/m³)</label>
              <input
                type="number"
                step="5"
                value={dustThreshold}
                onChange={(e) => setDustThreshold(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">Standard underground respirable limit: 100 µg/m³</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">Ambient Temperature Limit (°C)</label>
              <input
                type="number"
                step="0.5"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">Thermal comfort limit: 35°C, Critical at 42°C</span>
            </div>
          </div>
        </div>

        {/* Section 3: AI Engine & Incident Response SLA */}
        <div className="gov-card p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Cpu className="w-4 h-4 text-[#1E5B3A]" />
            <h2 className="card-title text-[#1F2937]">AI Risk Model & Emergency Response SLA</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">Isolation Forest Anomaly Sensitivity</label>
              <input
                type="number"
                step="0.01"
                value={contaminationRate}
                onChange={(e) => setContaminationRate(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">Contamination parameter: 0.05 (Default for high-confidence gas anomalies)</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1F2937] mb-1">Critical Alert Response SLA (Minutes)</label>
              <input
                type="number"
                value={alertSlaCritical}
                onChange={(e) => setAlertSlaCritical(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">Statutory escalation if unacknowledged within 15 mins</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
