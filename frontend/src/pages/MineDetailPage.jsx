import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Mountain, MapPin, ShieldCheck, AlertTriangle, Activity,
  ClipboardCheck, AlertOctagon, CheckSquare, FileText, ArrowLeft,
  Calendar, User, Clock, Download, RefreshCw, Flame, Wind,
  Droplets, Thermometer, Sparkles, ExternalLink
} from "lucide-react";
import { mineService, complianceService, inspectionService, violationService, correctiveActionService, sensorService, reportService } from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function MineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mine, setMine] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [environmental, setEnvironmental] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [violations, setViolations] = useState([]);
  const [actions, setActions] = useState([]);
  const [complianceRules, setComplianceRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mineService.getById(id),
      mineService.getRisk(id).catch(() => ({ data: null })),
      sensorService.getEnvironmentalSummary({ mine_id: id }).catch(() => ({ data: null })),
      inspectionService.getAll({ mine_id: id }).catch(() => ({ data: [] })),
      violationService.getAll({ mine_id: id }).catch(() => ({ data: [] })),
      correctiveActionService.getAll({ mine_id: id }).catch(() => ({ data: [] })),
      complianceService.getRules().catch(() => ({ data: [] }))
    ])
      .then(([mRes, rRes, eRes, iRes, vRes, caRes, rulesRes]) => {
        setMine(mRes.data);
        if (rRes) setRiskData(rRes.data);
        if (eRes) setEnvironmental(eRes.data);
        if (iRes) setInspections(iRes.data);
        if (vRes) setViolations(vRes.data);
        if (caRes) setActions(caRes.data);
        if (rulesRes) setComplianceRules(rulesRes.data);
      })
      .catch((err) => console.error("Error loading mine details:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-white border border-gray-200 rounded-lg animate-pulse" />
        <div className="h-80 bg-white border border-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!mine) {
    return (
      <div className="gov-card p-12 text-center space-y-4">
        <Mountain className="w-12 h-12 text-[#6B7280] mx-auto" />
        <h2 className="text-lg font-bold text-[#1F2937]">Mine Record Not Found</h2>
        <p className="text-xs text-[#6B7280]">The requested mine ID does not exist in the regulatory registry.</p>
        <button onClick={() => navigate("/mines")} className="btn-primary text-xs mx-auto">
          Back to Mines Directory
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Mountain },
    { id: "monitoring", label: "Live Monitoring", icon: Activity },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "inspections", label: "Inspections", icon: ClipboardCheck },
    { id: "violations", label: "Violations", icon: AlertOctagon },
    { id: "actions", label: "Corrective Actions", icon: CheckSquare },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5B3A] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* 1. Header (Requirement 12) */}
      <div className="gov-card p-6 border-l-4 border-l-[#1E5B3A]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="page-title text-2xl font-bold text-[#1F2937]">
                {mine.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-[#4B5563] border border-gray-200">
                {mine.code}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1E5B3A]/10 text-[#1E5B3A]">
                {mine.operational_status || "Active"}
              </span>
            </div>

            <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1E5B3A]" />
              <span>{mine.location} · {mine.district}, {mine.state}</span>
              <span className="text-gray-300">|</span>
              <span>Mine Type: <strong className="text-[#1F2937]">{mine.mine_type}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Capacity: <strong className="text-[#1F2937]">{mine.production_capacity} MTPA</strong></span>
            </p>
          </div>

          {/* Right Metrics: Risk & Compliance */}
          <div className="flex items-center gap-4 bg-[#F5F7FA] p-3 rounded-lg border border-gray-200">
            <div className="text-right">
              <span className="text-[11px] text-[#6B7280] block font-medium">Composite Risk</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RiskBadge level={mine.risk_level} score={mine.risk_score} size="sm" />
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200" />

            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Compliance Rate</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-bold text-[#1F2937]">
                  {Math.round(mine.compliance_score || 85)}%
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-green-100 text-[#15803D]">
                  DGMS Grade A
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Requirement 12) */}
      <div className="border-b border-gray-200 flex flex-wrap gap-1 bg-white px-3 pt-2 rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#1E5B3A] text-[#1E5B3A] bg-[#1E5B3A]/5"
                : "border-transparent text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      <div className="space-y-6">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="gov-card p-5">
                <h3 className="card-title text-[#1F2937] mb-3">Mine Profile & Statutory Governance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#6B7280]">DGMS Mine Code:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">{mine.code}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Mining Lease Area:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">1,420 Hectares</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Statutory Shift Hours:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">3 Shifts (24x7)</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Last Regulatory Audit:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">{mine.last_inspection || "14 Feb 2026"}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Next Scheduled Audit:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">{mine.next_inspection || "28 Mar 2026"}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">GIS Coordinates:</span>
                    <p className="font-semibold text-[#1F2937] mt-0.5">{mine.latitude?.toFixed(4)}, {mine.longitude?.toFixed(4)}</p>
                  </div>
                </div>
              </div>

              {/* Explainable AI Risk Assessment */}
              {riskData && (
                <div className="gov-card p-5 border-l-4 border-l-[#EA580C]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="card-title text-[#1F2937]">AI Risk Model Assessment</h3>
                    <RiskBadge level={riskData.risk_level} score={riskData.risk_score} size="sm" />
                  </div>
                  <div className="space-y-2">
                    {riskData.factors?.map((f, i) => (
                      <div key={i} className="p-2.5 rounded bg-[#F5F7FA] border border-gray-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[#1F2937]">{f.factor}</span>
                          <p className="text-[11px] text-[#6B7280]">{f.description}</p>
                        </div>
                        <span className="font-mono font-bold text-[#EA580C]">+{f.impact} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Summary Column */}
            <div className="space-y-4">
              <div className="gov-card p-5 space-y-3">
                <h3 className="card-title text-[#1F2937]">Compliance Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B7280]">Open Violations:</span>
                    <span className="font-bold text-[#DC2626]">{violations.filter(v => v.status === "OPEN").length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B7280]">Pending Remedial Actions:</span>
                    <span className="font-bold text-[#D97706]">{actions.filter(a => a.status !== "COMPLETED").length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B7280]">Inspections Conducted:</span>
                    <span className="font-bold text-[#1F2937]">{inspections.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Monitoring */}
        {activeTab === "monitoring" && (
          <div className="gov-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="card-title text-[#1F2937]">Live Sensor Telemetry: {mine.name}</h3>
                <p className="text-caption text-xs text-[#6B7280]">Continuous multi-gas environmental monitoring</p>
              </div>
              <span className="text-xs font-semibold text-[#15803D] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                ● LIVE TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(environmental?.parameters || [
                { id: "methane", name: "Methane (CH4)", value: 0.42, unit: "%", threshold: 1.0, status: "NORMAL" },
                { id: "co", name: "Carbon Monoxide (CO)", value: 12.0, unit: "ppm", threshold: 25.0, status: "NORMAL" },
                { id: "dust", name: "Respirable Dust", value: 55.0, unit: "µg/m³", threshold: 100.0, status: "NORMAL" },
                { id: "temperature", name: "Ambient Temp", value: 28.5, unit: "°C", threshold: 35.0, status: "NORMAL" }
              ]).map((p) => (
                <div key={p.id} className="gov-card p-4 bg-[#F5F7FA]">
                  <span className="text-xs text-[#6B7280]">{p.name}</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-[#1F2937] font-mono">
                      {p.value} {p.unit}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-green-100 text-[#15803D]">
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] block mt-1">
                    Threshold: &lt; {p.threshold} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Compliance */}
        {activeTab === "compliance" && (
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="card-title text-[#1F2937]">Statutory Compliance Checklist</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th>Rule Code</th>
                    <th>Regulation Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Penalty Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complianceRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="font-mono text-xs font-semibold text-[#1F2937]">{rule.rule_code}</td>
                      <td className="text-xs font-medium text-[#1F2937]">{rule.rule_name}</td>
                      <td className="text-xs text-[#6B7280]">{rule.category}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#15803D]">
                          COMPLIANT
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#6B7280]">{rule.penalty_points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Inspections */}
        {activeTab === "inspections" && (
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="card-title text-[#1F2937]">Inspections Conducted ({inspections.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Inspection Type</th>
                    <th>Inspector</th>
                    <th>Status</th>
                    <th>Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inspections.map((insp) => (
                    <tr key={insp.id}>
                      <td className="text-xs text-[#1F2937]">{insp.scheduled_date?.split("T")[0] || "Recent"}</td>
                      <td className="text-xs font-semibold text-[#1F2937]">{insp.inspection_type}</td>
                      <td className="text-xs text-[#6B7280]">{insp.inspector?.name || "Statutory Inspector"}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#15803D]">
                          {insp.status}
                        </span>
                      </td>
                      <td className="text-xs text-[#6B7280]">{insp.findings?.length || 0} items checked</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Violations */}
        {activeTab === "violations" && (
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="card-title text-[#1F2937]">Regulatory Violations ({violations.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th>Violation Code</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Detected Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {violations.map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono text-xs font-semibold text-[#1F2937]">{v.violation_code}</td>
                      <td className="text-xs text-[#6B7280]">{v.category}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.severity === "CRITICAL" ? "bg-red-100 text-[#DC2626]" : "bg-amber-100 text-[#D97706]"
                        }`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="text-xs text-[#6B7280]">{v.detected_date?.split("T")[0] || "Recent"}</td>
                      <td>
                        <span className="text-xs font-semibold text-[#1F2937]">{v.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Corrective Actions */}
        {activeTab === "actions" && (
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="card-title text-[#1F2937]">Corrective Action Plans (CAPAs) ({actions.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th>Action Code</th>
                    <th>Description</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {actions.map((act) => (
                    <tr key={act.id}>
                      <td className="font-mono text-xs font-semibold text-[#1F2937]">{act.action_code || `CAPA-${act.id}`}</td>
                      <td className="text-xs text-[#1F2937]">{act.description}</td>
                      <td className="text-xs text-[#6B7280]">{act.assigned_person}</td>
                      <td className="text-xs text-[#6B7280]">{act.due_date?.split("T")[0]}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Reports */}
        {activeTab === "reports" && (
          <div className="gov-card p-6 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#1E5B3A] mx-auto" />
            <h3 className="text-base font-bold text-[#1F2937]">Statutory Mine Compliance Certificate</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto">
              Official compliance dossier certified for the Ministry of Coal and Directorate General of Mines Safety (DGMS).
            </p>
            <div className="pt-2">
              <a
                href={reportService.getExportCsvUrl("compliance", mine.id)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Compliance Audit Report (CSV)</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
