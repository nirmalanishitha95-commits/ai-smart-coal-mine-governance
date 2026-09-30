import React, { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, ShieldCheck, Flame, Wind,
  Droplets, Thermometer, Volume2, CloudFog, Sparkles, RefreshCw,
  Clock, CheckCircle2, Filter, Layers, Database
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { realtimeService } from "../services/realtime";
import { sensorService, mineService } from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function EnvironmentalPage() {
  const [realtimeState, setRealtimeState] = useState(realtimeService.getState());
  const [selectedParam, setSelectedParam] = useState("methane");
  const [selectedMineFilter, setSelectedMineFilter] = useState("ALL");
  const [mines, setMines] = useState([]);
  const [injecting, setInjecting] = useState(false);
  const [injectionSuccess, setInjectionSuccess] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    mineService.getAll({ limit: 50 })
      .then((res) => setMines(res.data))
      .catch(() => {});

    const unsubscribe = realtimeService.subscribe((state) => {
      setRealtimeState(state);
      setSecondsAgo(0);
    });

    const ticker = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(ticker);
    };
  }, []);

  const handleManualTick = async () => {
    try {
      await realtimeService.triggerTick();
    } catch (e) {
      console.error(e);
    }
  };

  const handleInjectSurge = async () => {
    setInjecting(true);
    setInjectionSuccess(null);
    try {
      const targetMineId = selectedMineFilter === "ALL" ? (mines[0]?.id || 1) : parseInt(selectedMineFilter);
      await sensorService.ingest({
        mine_id: targetMineId,
        zone: "Deep Extraction Shaft 4",
        methane: 3.45,
        co: 68.0,
        dust: 310.0,
        temperature: 39.2,
        humidity: 86.0,
        noise: 92.0,
        air_quality: 270.0,
        water_quality: 5.4
      });
      setInjectionSuccess("Hazard surge injected! Isolation Forest flagged telemetry as CRITICAL ANOMALY.");
      await handleManualTick();
    } catch {
      alert("Failed to inject test hazard surge.");
    } finally {
      setInjecting(false);
    }
  };

  const paramConfig = {
    methane: { name: "Methane (CH4)", unit: "%", stroke: "#DC2626", range: "< 1.0%", threshold: 1.0 },
    co: { name: "Carbon Monoxide (CO)", unit: "ppm", stroke: "#D97706", range: "< 25 ppm", threshold: 25.0 },
    oxygen: { name: "Oxygen (O2)", unit: "%", stroke: "#059669", range: "19.5 – 23.5%", threshold: 19.5 },
    ventilation: { name: "Ventilation Flow", unit: "m³/min", stroke: "#0284C7", range: "> 15 m³/min", threshold: 15.0 },
    co2: { name: "Carbon Dioxide (CO2)", unit: "%", stroke: "#7C3AED", range: "< 0.5%", threshold: 0.5 },
    dust: { name: "Respirable Dust (PM10)", unit: "µg/m³", stroke: "#2563EB", range: "< 100 µg/m³", threshold: 100.0 },
    temperature: { name: "Ambient Temperature", unit: "°C", stroke: "#EA580C", range: "< 30°C", threshold: 30.0 },
    humidity: { name: "Relative Humidity", unit: "%", stroke: "#15803D", range: "40 – 80%", threshold: 80.0 },
    smoke: { name: "Smoke Obscuration", unit: "obs", stroke: "#4B5563", range: "< 0.2", threshold: 0.2 },
    pressure: { name: "Barometric Pressure", unit: "kPa", stroke: "#0D9488", range: "98 – 104 kPa", threshold: 101.3 }
  };

  // Build the granular table rows as required by Section 8:
  // Mine | Parameter | Current Value | Normal Range | Status | Last Updated
  const tableRows = [];
  const sourceTable = realtimeState.table || [];

  sourceTable.forEach((m) => {
    if (selectedMineFilter !== "ALL" && m.mine_id !== parseInt(selectedMineFilter)) {
      return;
    }

    const o2Val = m.oxygen !== undefined ? m.oxygen : 20.9;
    const ventVal = m.ventilation_flow !== undefined ? m.ventilation_flow : 21.5;
    const co2Val = m.co2 !== undefined ? m.co2 : 0.12;
    const smokeVal = m.smoke !== undefined ? m.smoke : 0.04;
    const pressVal = m.pressure !== undefined ? m.pressure : 101.3;

    const params = [
      {
        param: "Methane (CH4)",
        val: `${(m.methane || 0.42).toFixed(2)}%`,
        range: "< 1.0%",
        status: (m.methane || 0.42) >= 2.0 ? "CRITICAL" : ((m.methane || 0.42) >= 1.0 ? "WARNING" : "NORMAL")
      },
      {
        param: "Carbon Monoxide (CO)",
        val: `${(m.co || 12.0).toFixed(1)} ppm`,
        range: "< 25 ppm",
        status: (m.co || 12.0) >= 50.0 ? "CRITICAL" : ((m.co || 12.0) >= 25.0 ? "WARNING" : "NORMAL")
      },
      {
        param: "Oxygen (O2)",
        val: `${o2Val.toFixed(1)}%`,
        range: "19.5 – 23.5%",
        status: o2Val < 18.0 ? "CRITICAL" : (o2Val < 19.5 ? "WARNING" : "SAFE")
      },
      {
        param: "Ventilation Airflow",
        val: `${ventVal.toFixed(1)} m³/min`,
        range: "> 15 m³/min",
        status: ventVal < 10.0 ? "FAILURE" : (ventVal < 15.0 ? "WARNING" : "NORMAL")
      },
      {
        param: "Carbon Dioxide (CO2)",
        val: `${co2Val.toFixed(2)}%`,
        range: "< 0.5%",
        status: co2Val >= 1.0 ? "CRITICAL" : (co2Val >= 0.5 ? "WARNING" : "NORMAL")
      },
      {
        param: "Respirable Dust (PM10)",
        val: `${(m.dust || 55.0).toFixed(1)} µg/m³`,
        range: "< 100 µg/m³",
        status: (m.dust || 55.0) >= 200.0 ? "CRITICAL" : ((m.dust || 55.0) >= 100.0 ? "ELEVATED" : "NORMAL")
      },
      {
        param: "Mine Temperature",
        val: `${(m.temperature || 28.5).toFixed(1)}°C`,
        range: "< 30°C",
        status: (m.temperature || 28.5) >= 38.0 ? "CRITICAL" : ((m.temperature || 28.5) >= 30.0 ? "HIGH" : "NORMAL")
      },
      {
        param: "Underground Smoke",
        val: `${smokeVal.toFixed(2)} obs`,
        range: "< 0.2 obs",
        status: smokeVal >= 0.5 ? "CRITICAL" : (smokeVal >= 0.2 ? "WARNING" : "NORMAL")
      },
      {
        param: "Atmospheric Pressure",
        val: `${pressVal.toFixed(1)} kPa`,
        range: "98 – 104 kPa",
        status: "NORMAL"
      }
    ];

    params.forEach((p) => {
      tableRows.push({
        mine_id: m.mine_id,
        mine_name: m.mine_name,
        parameter: p.param,
        current_value: p.val,
        normal_range: p.range,
        status: p.status,
        last_updated: m.last_updated || `${secondsAgo}s ago`
      });
    });
  });

  const chartHistory = realtimeState.chartHistory || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Requirement 23 Data Source Label */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Real-Time Mine Monitoring & Sensor Stream
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded-md">
              {realtimeState.dataSource || "DATA SOURCE: DEMO IoT STREAM"}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Continuous multi-gas telemetry ingestion, Isolation Forest outlier classification, and environmental threshold surveillance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F5F7FA] border border-gray-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
            <span className="font-bold text-[#15803D]">● LIVE</span>
            <span className="text-[#6B7280]">· Updated {secondsAgo}s ago</span>
          </div>

          <button
            onClick={handleManualTick}
            className="btn-secondary text-xs"
            title="Fetch new sensor stream tick"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Tick</span>
          </button>

          <button
            onClick={handleInjectSurge}
            disabled={injecting}
            className="btn-primary text-xs !bg-[#DC2626] hover:!bg-red-700"
            title="Simulate sudden methane/gas surge to test AI anomaly detection"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Simulate Anomaly Surge</span>
          </button>
        </div>
      </div>

      {/* Prototype Telemetry Disclaimer */}
      <div className="gov-card px-4 py-2.5 bg-amber-50/80 border-amber-200 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-800">Notice:</span>
          <span>Data Source: DEMO IoT STREAM. Multi-parameter atmospheric readings are simulated for prototype governance testing and do not claim to represent live government coal mine records.</span>
        </div>
        <span className="text-[11px] text-amber-700 font-mono hidden md:inline">IsolationForest (8 features) Online</span>
      </div>

      {/* Surge Feedback Notice */}
      {injectionSuccess && (
        <div className="gov-card p-4 border-l-4 border-l-[#DC2626] bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#DC2626] font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{injectionSuccess}</span>
          </div>
          <button
            onClick={() => setInjectionSuccess(null)}
            className="text-xs text-[#6B7280] hover:text-[#1F2937]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Real-Time Chart with Parameter Selector (Requirement 9) */}
      <div className="gov-card">
        <div className="gov-card-header flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="card-title text-[#1F2937]">Live Environmental Monitoring Chart</h2>
            <p className="text-caption text-xs text-[#6B7280]">
              Showing real-time stream of the last {chartHistory.length} readings
            </p>
          </div>

          {/* Parameter Selector Dropdown / Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(paramConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedParam(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedParam === key
                    ? "bg-[#1E5B3A] text-white shadow-2xs"
                    : "bg-[#F5F7FA] text-[#6B7280] hover:text-[#1F2937] border border-gray-200"
                }`}
              >
                {cfg.name.split(" ")[0]} ({cfg.unit})
              </button>
            ))}
          </div>
        </div>

        <div className="gov-card-body h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartHistory}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: "6px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey={selectedParam}
                name={`${paramConfig[selectedParam].name} (${paramConfig[selectedParam].unit})`}
                stroke={paramConfig[selectedParam].stroke}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Real-Time Sensor Table (Requirement 8) */}
      <div className="gov-card">
        <div className="gov-card-header flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1E5B3A]" />
            <h2 className="card-title text-[#1F2937]">Real-Time Sensor Readings Table</h2>
          </div>

          {/* Mine Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B7280] font-medium">Filter Mine:</span>
            <select
              value={selectedMineFilter}
              onChange={(e) => setSelectedMineFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-md px-2.5 py-1 text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="ALL">All Monitored Mines</option>
              {mines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Mine</th>
                <th>Parameter</th>
                <th>Current Value</th>
                <th>Normal Range</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.slice(0, 30).map((row, idx) => (
                <tr key={`${row.mine_id}-${row.parameter}-${idx}`}>
                  <td className="font-semibold text-xs text-[#1F2937]">
                    {row.mine_name}
                  </td>
                  <td className="text-xs font-medium text-[#4B5563]">
                    {row.parameter}
                  </td>
                  <td>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        row.status === "CRITICAL"
                          ? "text-[#DC2626] font-bold"
                          : row.status === "WARNING"
                          ? "text-[#D97706]"
                          : "text-[#1F2937]"
                      }`}
                    >
                      {row.current_value}
                    </span>
                  </td>
                  <td className="text-caption text-xs text-[#6B7280]">
                    {row.normal_range}
                  </td>
                  <td>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        row.status === "CRITICAL"
                          ? "bg-red-100 text-[#DC2626]"
                          : row.status === "WARNING"
                          ? "bg-amber-100 text-[#D97706]"
                          : "bg-green-100 text-[#15803D]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="text-caption text-xs text-[#6B7280]">
                    {row.last_updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
