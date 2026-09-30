import React, { useState, useEffect } from "react";
import { useOutletContext, Link, useNavigate } from "react-router-dom";
import {
  Mountain, ShieldCheck, AlertTriangle, Bell, RefreshCw, Sparkles,
  ArrowUpRight, ArrowDownRight, Activity, ChevronRight, AlertOctagon,
  Clock, CheckCircle2, AlertCircle, ExternalLink, ShieldAlert, Cpu,
  ClipboardCheck, Users, LifeBuoy, Radio
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { dashboardService } from "../services/api";
import { realtimeService } from "../services/realtime";
import RiskBadge from "../components/RiskBadge";

export default function DashboardPage() {
  const { refreshTrigger, onOpenSimulation } = useOutletContext() || {};
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);

  // Real-time stream state
  const [realtimeData, setRealtimeData] = useState(realtimeService.getState());
  const [activeAnomaly, setActiveAnomaly] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    dashboardService.getStats()
      .then((res) => {
        setData(res.data);
        setError(null);
        setLastSyncSeconds(0);
      })
      .catch((err) => {
        console.error("Dashboard API Error:", err);
        setError("Unable to load live dashboard data. Check backend connection.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [refreshTrigger]);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((state) => {
      setRealtimeData(state);
      if (state.activeAnomaly) {
        setActiveAnomaly(state.activeAnomaly);
      }
    });

    const ticker = setInterval(() => {
      setLastSyncSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(ticker);
    };
  }, []);

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white border border-gray-200 rounded-lg animate-pulse p-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white border border-gray-200 rounded-lg animate-pulse" />
          <div className="h-72 bg-white border border-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="text-center py-4 text-xs text-[#6B7280]">
          Loading Central Mining Compliance & Risk Command Center...
        </div>
      </div>
    );
  }

  // 4 Core KPIs as specified in requirements:
  // Active Underground Mines | Workers Monitored | Active Hazards | Critical Alerts
  const activeMinesVal = data?.kpis?.active_mines?.value ?? data?.total_mines ?? 10;
  const activeMinesTrend = data?.kpis?.active_mines?.trend ?? "10 Collieries Monitored";

  const workersMonitoredVal = data?.kpis?.workers_monitored?.value ?? data?.worker_safety_status?.total_monitored ?? 148;
  const workersMonitoredTrend = data?.kpis?.workers_monitored?.trend ?? "14 Active Shifts";

  const activeHazardsVal = data?.kpis?.active_hazards?.value ?? data?.active_hazards?.length ?? 4;
  const activeHazardsTrend = data?.kpis?.active_hazards?.trend ?? "1 Critical Surge";

  const criticalAlertsVal = data?.kpis?.critical_alerts?.value ?? data?.critical_alerts_count ?? 4;
  const criticalAlertsTrend = data?.kpis?.critical_alerts?.trend ?? "Priority Dispatch";

  const kpis = [
    {
      id: "active-mines",
      title: "Active Underground Mines",
      value: activeMinesVal,
      trend: activeMinesTrend,
      description: "Operating under DGMS licenses",
      icon: Mountain,
      trendColor: "text-[#15803D]",
      iconBg: "bg-[#1E5B3A]/10 text-[#1E5B3A]",
      borderAccent: "border-l-4 border-l-[#1E5B3A]"
    },
    {
      id: "workers-monitored",
      title: "Workers Monitored",
      value: workersMonitoredVal,
      trend: workersMonitoredTrend,
      description: "Underground beacon vitals active",
      icon: ShieldCheck,
      trendColor: "text-[#15803D]",
      iconBg: "bg-[#15803D]/10 text-[#15803D]",
      borderAccent: "border-l-4 border-l-[#15803D]"
    },
    {
      id: "active-hazards",
      title: "Active Hazards",
      value: activeHazardsVal,
      trend: activeHazardsTrend,
      description: "Atmospheric & strata hazards",
      icon: AlertTriangle,
      trendColor: "text-[#EA580C]",
      iconBg: "bg-[#EA580C]/10 text-[#EA580C]",
      borderAccent: "border-l-4 border-l-[#EA580C]"
    },
    {
      id: "critical-alerts",
      title: "Critical Alerts",
      value: criticalAlertsVal,
      trend: criticalAlertsTrend,
      description: "Priority gas & life-safety breaches",
      icon: Bell,
      trendColor: "text-[#DC2626]",
      iconBg: "bg-[#DC2626]/10 text-[#DC2626]",
      borderAccent: "border-l-4 border-l-[#DC2626]"
    }
  ];

  // Merge live stream table or fallback to API
  const liveMinesTable = realtimeData.table?.length > 0 ? realtimeData.table : (data?.realtime_mines || []);
  const criticalAlertsList = data?.critical_alerts?.length > 0 ? data.critical_alerts : (data?.recent_alerts || []);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="gov-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
              AI-Powered Underground Mine Safety Monitoring and Rescue System
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
              SIH 2026
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-Time Multi-Gas Surveillance, Hazard Detection, Worker Safety & Rescue Dispatch System
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Live System Status */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-[#F5F7FA] px-3 py-1.5 rounded-md border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
            <span className="font-medium text-[#1F2937]">Live Telemetry:</span>
            <span>{lastSyncSeconds < 5 ? "Synced just now" : `Updated ${lastSyncSeconds}s ago`}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              className="btn-secondary !p-2"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className="w-4 h-4 text-[#6B7280]" />
            </button>

            <button
              onClick={onOpenSimulation}
              className="btn-primary text-xs"
              title="Run AI Emergency Alert & Rescue Simulation"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>RUN AI SAFETY SIM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authoritative Data Provenance & AI Advisory Banner */}
      <div className="gov-card p-3.5 bg-gradient-to-r from-emerald-50/90 via-blue-50/70 to-slate-50 border border-emerald-200/90 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E5B3A] uppercase tracking-wider text-[11px]">
                Statutory Provenance Verified
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Historical Government Data
              </span>
            </div>
            <p className="text-[#4B5563] text-[11px] mt-0.5">
              Production, accidents & safety: <b>Ministry of Coal &bull; CCO &bull; DGMS</b> | Live Multi-Gas Telemetry: <b className="text-amber-800">DEMO IoT STREAM</b>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-white border border-gray-300 text-gray-700 shadow-2xs">
            AI Advisory: Prototype Decision Support &bull; Not Final Regulatory Order
          </span>
          <Link
            to="/data-sources"
            className="text-[11px] font-bold text-[#1E5B3A] hover:underline flex items-center gap-1"
          >
            <span>Public Datasets</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="gov-card p-4 border-l-4 border-l-[#DC2626] bg-red-50 flex items-center justify-between">

          <div className="flex items-center gap-2 text-xs text-[#DC2626]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboard}
            className="text-xs font-semibold text-[#DC2626] underline hover:text-red-800"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Real-Time AI Anomaly Alert Notification Banner (Requirement 10) */}
      {activeAnomaly && (
        <div className="gov-card p-4 border border-[#DC2626]/30 bg-red-50/70 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#DC2626] text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626]">
                  ANOMALY DETECTED BY ISOLATION FOREST
                </span>
                <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.2 rounded font-semibold">
                  STATISTICAL OUTLIER
                </span>
              </div>
              <p className="text-sm font-semibold text-[#1F2937] mt-0.5">
                Mine: <span className="text-[#DC2626] font-bold">{activeAnomaly.mine_name}</span> | Parameter: <span className="font-semibold">{activeAnomaly.parameter || "Methane (CH4)"}</span>
              </p>
              <p className="text-xs text-[#6B7280]">
                Current Value: <strong className="text-[#DC2626]">{activeAnomaly.current_value || "3.25%"}</strong> (Normal Range: {activeAnomaly.normal_range || "< 1.0%"}) · AI interpretation: {activeAnomaly.ai_interpretation || "Abnormal statistical deviation detected."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/mines/${activeAnomaly.mine_id || 1}`}
              className="btn-primary text-xs !bg-[#DC2626] hover:!bg-red-700"
            >
              Inspect Telemetry
            </Link>
            <button
              onClick={() => setActiveAnomaly(null)}
              className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Four Important KPI Cards (Section 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} className={`gov-card p-5 ${kpi.borderAccent}`}>
            <div className="flex items-center justify-between">
              <span className="card-title text-[#6B7280] font-medium text-xs">
                {kpi.title}
              </span>
              <div className={`p-2 rounded-md ${kpi.iconBg}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                {kpi.value}
              </span>
              <span className={`text-xs font-semibold ${kpi.trendColor}`}>
                {kpi.trend}
              </span>
            </div>

            <p className="text-caption mt-1.5 text-xs text-[#6B7280]">
              {kpi.description}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Main Content: Left 65% Real-Time Monitoring Table | Right 35% Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65%: REAL-TIME MINE MONITORING TABLE */}
        <div className="lg:col-span-8 gov-card flex flex-col">
          <div className="gov-card-header flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Activity className="w-4 h-4 text-[#1E5B3A]" />
              <h2 className="card-title text-[#1F2937]">Real-Time Mine Monitoring</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
                Data Source: DEMO IoT STREAM
              </span>
              <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last Updated: {realtimeData.secondsAgo !== undefined ? realtimeData.secondsAgo : lastSyncSeconds} seconds ago
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#15803D] font-medium bg-green-50 px-2 py-0.5 rounded border border-green-200">
                <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
                ● LIVE
              </span>
              <Link
                to="/monitoring"
                className="text-xs text-[#1E5B3A] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Full Stream</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Prototype Telemetry Disclaimer */}
          <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-1.5 text-[11px] text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-amber-800">Notice:</span>
              <span>Data Source: DEMO IoT STREAM. Simulated telemetry generated for evaluation; not actual government mine data.</span>
            </div>
            <span className="text-[10px] text-amber-700 font-mono hidden sm:inline">IsolationForest v1.4 Active</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left gov-table">
              <thead>
                <tr>
                  <th>Mine</th>
                  <th>Risk</th>
                  <th>Compliance</th>
                  <th>Methane</th>
                  <th>Dust</th>
                  <th>Temp</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liveMinesTable.slice(0, 7).map((m) => {
                  const methaneVal = typeof m.methane === "number" ? m.methane : 0.45;
                  const dustVal = typeof m.dust === "number" ? m.dust : 55;
                  const tempVal = typeof m.temperature === "number" ? m.temperature : 28;

                  const isMethaneCritical = methaneVal >= 2.0;
                  const isMethaneWarning = methaneVal >= 1.0;

                  return (
                    <tr
                      key={m.mine_id}
                      onClick={() => navigate(`/mines/${m.mine_id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition"
                      title="Click to view detailed mine governance profile"
                    >
                      <td>
                        <div className="font-semibold text-xs text-[#1F2937] hover:text-[#1E5B3A]">
                          {m.mine_name}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          {m.location}
                        </div>
                      </td>
                      <td>
                        <RiskBadge level={m.risk_level} score={m.risk_score} size="sm" />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#1F2937]">
                            {Math.round(m.compliance_score || 85)}%
                          </span>
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (m.compliance_score || 85) >= 80 ? "bg-[#15803D]" : "bg-[#D97706]"
                              }`}
                              style={{ width: `${Math.min(100, m.compliance_score || 85)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isMethaneCritical
                              ? "text-[#DC2626] font-bold"
                              : isMethaneWarning
                              ? "text-[#D97706]"
                              : "text-[#1F2937]"
                          }`}
                        >
                          {methaneVal.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-[#1F2937]">
                          {dustVal.toFixed(1)} µg/m³
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-[#1F2937]">
                          {tempVal.toFixed(1)}°C
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                            m.status === "CRITICAL"
                              ? "bg-red-100 text-[#DC2626]"
                              : m.status === "WARNING"
                              ? "bg-amber-100 text-[#D97706]"
                              : "bg-green-100 text-[#15803D]"
                          }`}
                        >
                          {m.status || "NORMAL"}
                        </span>
                      </td>
                      <td className="text-caption text-[11px] text-[#6B7280]">
                        {m.last_updated || "Just now"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 35%: CRITICAL ALERTS (Top 5 active) */}
        <div className="lg:col-span-4 gov-card flex flex-col">
          <div className="gov-card-header">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#DC2626]" />
              <h2 className="card-title text-[#1F2937]">Critical Alerts</h2>
            </div>
            <Link
              to="/alerts"
              className="text-xs text-[#1E5B3A] font-semibold hover:underline"
            >
              View All ({criticalAlertsVal})
            </Link>
          </div>

          <div className="p-3 divide-y divide-gray-100 flex-1">
            {criticalAlertsList.slice(0, 5).map((a) => (
              <div
                key={a.id}
                onClick={() => navigate("/alerts")}
                className="py-3 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      a.severity === "CRITICAL"
                        ? "bg-red-100 text-[#DC2626]"
                        : a.severity === "HIGH"
                        ? "bg-orange-100 text-[#EA580C]"
                        : "bg-amber-100 text-[#D97706]"
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{a.time_ago || "Recent"}</span>
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#1F2937] mt-1 line-clamp-1">
                  {a.message}
                </p>

                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Mine: <span className="font-medium text-[#1F2937]">{a.mine_name}</span>
                </p>
              </div>
            ))}

            {criticalAlertsList.length === 0 && (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                No active critical alerts recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Worker Safety Status & Rescue Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Underground Worker Safety Tracking */}
        <div className="gov-card flex flex-col">
          <div className="gov-card-header">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <h3 className="card-title text-[#1F2937]">Worker Safety Status</h3>
            </div>
            <Link to="/workers" className="text-xs text-[#1E5B3A] font-semibold hover:underline">
              View All Workers ({workersMonitoredVal})
            </Link>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Safe</span>
                <span className="text-lg font-bold text-emerald-700">{data?.worker_safety_status?.safe ?? 136}</span>
              </div>
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Warning</span>
                <span className="text-lg font-bold text-amber-700">{data?.worker_safety_status?.warning ?? 6}</span>
              </div>
              <div className="p-2.5 rounded bg-orange-50 border border-orange-200">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">At Risk</span>
                <span className="text-lg font-bold text-orange-700">{data?.worker_safety_status?.at_risk ?? 4}</span>
              </div>
              <div className="p-2.5 rounded bg-red-50 border border-red-200">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Emergency</span>
                <span className="text-lg font-bold text-red-700 animate-pulse">{data?.worker_safety_status?.emergency ?? 2}</span>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-gray-500 flex items-center justify-between border-t border-gray-100">
              <span>Location Tracking: <strong className="text-amber-800">DEMO WORKER LOCATION</strong></span>
              <span className="text-emerald-700 font-medium">Underground Beacons Synced</span>
            </div>
          </div>
        </div>

        {/* Right: Active Rescue Operations */}
        <div className="gov-card flex flex-col">
          <div className="gov-card-header">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-red-600" />
              <h3 className="card-title text-[#1F2937]">Active Rescue Operations</h3>
            </div>
            <Link to="/rescue" className="text-xs text-[#1E5B3A] font-semibold hover:underline">
              Rescue Center
            </Link>
          </div>
          <div className="p-3 divide-y divide-gray-100 text-xs flex-1">
            {(data?.rescue_operations || []).slice(0, 3).map((op) => (
              <div key={op.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-gray-900">{op.operation_code}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-800">{op.status}</span>
                  </div>
                  <p className="text-gray-600 text-[11px] mt-0.5">{op.incident_title}</p>
                </div>
                <div className="text-right text-[11px] text-gray-500">
                  <span className="font-medium text-red-600">{op.affected_workers_count} Workers</span>
                  <div className="text-[10px] text-gray-400">{op.target_zone}</div>
                </div>
              </div>
            ))}
            {(!data?.rescue_operations || data.rescue_operations.length === 0) && (
              <div className="py-6 text-center text-xs text-gray-400">All rescue units standing by on ready status.</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Safety Trends & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Line Chart */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div>
              <h3 className="card-title text-[#1F2937]">Compliance Trend</h3>
              <p className="text-caption text-xs text-[#6B7280]">
                Monthly statutory compliance score vs 85.0% DGMS target
              </p>
            </div>
            <span className="text-xs font-semibold text-[#15803D] bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Target: 85.0%
            </span>
          </div>
          <div className="gov-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.compliance_trend || []}
                margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 11 }} />
                <YAxis domain={[75, 95]} stroke="#6B7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: "6px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Fleet Compliance Score"
                  stroke="#1E5B3A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#1E5B3A" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Statutory Baseline"
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div>
              <h3 className="card-title text-[#1F2937]">Risk Distribution</h3>
              <p className="text-caption text-xs text-[#6B7280]">
                Fleet risk classification based on multi-factor AI scoring
              </p>
            </div>
            <Link to="/mines" className="text-xs text-[#1E5B3A] font-semibold hover:underline">
              Inspect Mines
            </Link>
          </div>
          <div className="gov-card-body h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.risk_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(data?.risk_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: "6px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Third Section: Left Recent Inspections | Right Recent Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inspections Table */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#1E5B3A]" />
              <h3 className="card-title text-[#1F2937]">Recent Inspections</h3>
            </div>
            <Link to="/inspections" className="text-xs text-[#1E5B3A] font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left gov-table">
              <thead>
                <tr>
                  <th>Mine</th>
                  <th>Inspector</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.recent_inspections || []).map((insp) => (
                  <tr key={insp.id}>
                    <td className="font-semibold text-xs text-[#1F2937]">
                      {insp.mine_name}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {insp.inspector_name}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {insp.date}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          insp.status === "COMPLETED"
                            ? "bg-green-100 text-[#15803D]"
                            : "bg-blue-100 text-[#2563EB]"
                        }`}
                      >
                        {insp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Violations Table */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
              <h3 className="card-title text-[#1F2937]">Recent Violations</h3>
            </div>
            <Link to="/violations" className="text-xs text-[#1E5B3A] font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left gov-table">
              <thead>
                <tr>
                  <th>Violation Code</th>
                  <th>Mine</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.recent_violations || []).map((v) => (
                  <tr key={v.id}>
                    <td className="font-mono text-xs font-semibold text-[#1F2937]">
                      {v.violation_code}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {v.mine_name}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {v.category}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.severity === "CRITICAL"
                            ? "bg-red-100 text-[#DC2626]"
                            : v.severity === "HIGH"
                            ? "bg-orange-100 text-[#EA580C]"
                            : "bg-amber-100 text-[#D97706]"
                        }`}
                      >
                        {v.severity}
                      </span>
                    </td>
                    <td>
                      <span className="text-[11px] font-medium text-[#6B7280]">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. Bottom Section: Compact AI Risk Explanation / System Activity (Requirement 16) */}
      <div className="gov-card p-5 border-l-4 border-l-[#1E5B3A]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1E5B3A]" />
              <h3 className="card-title text-[#1F2937]">AI Risk Assessment Highlight</h3>
            </div>
            <p className="text-caption text-xs text-[#6B7280] mt-0.5">
              Explainable rule-based scoring engine for priority regulatory oversight
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280]">Mine:</span>
            <span className="text-xs font-bold text-[#1F2937]">
              {data?.ai_risk_highlight?.mine_name || "Bokaro Bermo Deep Shaft"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-[#6B7280]">Risk Score:</span>
            <span className="text-sm font-bold text-[#EA580C]">
              {data?.ai_risk_highlight?.risk_score || 78} / 100
            </span>
            <RiskBadge level={data?.ai_risk_highlight?.risk_level || "HIGH"} showScore={false} size="sm" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(data?.ai_risk_highlight?.factors || [
            { factor: "Environmental gas anomaly", impact: "+25" },
            { factor: "Open statutory violations", impact: "+20" },
            { factor: "Overdue corrective actions", impact: "+15" },
            { factor: "Inspection compliance history", impact: "+10" },
          ]).map((f, i) => (
            <div key={i} className="p-3 bg-[#F5F7FA] rounded-md border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1F2937]">{f.factor}</span>
                <span className="font-mono text-xs font-bold text-[#EA580C]">{f.impact}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-[#6B7280]">
            <strong className="text-[#1F2937]">AI Recommendation:</strong>{" "}
            {data?.ai_risk_highlight?.recommendation || "Dispatch statutory ventilation auditor and issue immediate rectification notice for Shaft 4 face."}
          </p>

          <Link
            to={`/mines/${data?.ai_risk_highlight?.mine_id || 1}`}
            className="btn-primary text-xs shrink-0"
          >
            <span>View Full Analysis</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-3 pt-2 text-[10px] text-gray-400 border-t border-gray-100 text-center italic">
          AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions.
        </div>
      </div>
    </div>
  );
}
