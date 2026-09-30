import React, { useState, useEffect } from "react";
import {
  AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Flame,
  Wind, MapPin, Activity, Check, X, ShieldCheck
} from "lucide-react";
import { hazardService, mineService } from "../services/api";

export default function HazardDetectionPage() {
  const [hazards, setHazards] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [resolvingId, setResolvingId] = useState(null);
  const [actionText, setActionText] = useState("");

  const fetchHazards = async () => {
    setLoading(true);
    try {
      const [hRes, mRes] = await Promise.all([
        hazardService.getAll(),
        mineService.getAll({ limit: 50 }),
      ]);
      setHazards(hRes.data);
      setMines(mRes.data);
    } catch (err) {
      console.error("Failed to load hazards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
    const interval = setInterval(fetchHazards, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await hazardService.resolve(id, actionText || "Physical inspection conducted; ventilation restored to safe limits.");
      setResolvingId(null);
      setActionText("");
      await fetchHazards();
    } catch (err) {
      alert("Failed to resolve hazard.");
    }
  };

  const filteredHazards = hazards.filter((h) => {
    if (filterSeverity !== "ALL" && h.severity !== filterSeverity) return false;
    if (filterStatus !== "ALL" && h.status !== filterStatus) return false;
    return true;
  });

  const activeHazards = hazards.filter((h) => h.status === "ACTIVE");
  const criticalHazards = activeHazards.filter((h) => h.severity === "CRITICAL");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Underground Hazard Detection & Mitigation
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded-full border border-red-200">
              AI Multi-Gas & Strata Engine
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time multi-hazard classification, methane surges, ventilation failures, and automated statutory mitigation tracking.
          </p>
        </div>

        <button
          onClick={fetchHazards}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Refresh Hazards
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Hazards</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeHazards.length}</p>
          <span className="text-[11px] font-medium text-red-600">Immediate attention</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Critical Surges</span>
            <Flame className="w-4 h-4 text-red-700" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{criticalHazards.length}</p>
          <span className="text-[11px] font-medium text-red-700">Evacuation protocols</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Resolved Hazards</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {hazards.filter((h) => h.status === "RESOLVED").length}
          </p>
          <span className="text-[11px] font-medium text-emerald-600">Statutory clearance</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Detection Method</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 mt-2">Isolation Forest</p>
          <span className="text-[11px] font-medium text-gray-500">Scikit-learn Anomaly Engine</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 text-xs">
        <span className="font-medium text-gray-600">Filter:</span>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 text-xs"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      {/* Hazards Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">Hazard Description</th>
              <th className="py-3 px-4">Colliery & Zone</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Action Taken</th>
              <th className="py-3 px-4 text-right">Mitigation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredHazards.map((h) => {
              const isCrit = h.severity === "CRITICAL";
              const isActive = h.status === "ACTIVE";
              return (
                <tr key={h.id} className={`hover:bg-gray-50/80 transition ${isCrit && isActive ? "bg-red-50/20" : ""}`}>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{h.title}</div>
                    <div className="text-[11px] text-gray-500">{h.description}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{h.mine_name}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {h.zone}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-gray-700">
                    {h.hazard_type}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCrit
                          ? "bg-red-100 text-red-800 animate-pulse"
                          : h.severity === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {h.severity}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isActive ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                    {h.actions_taken || "Pending physical investigation"}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {isActive ? (
                      resolvingId === h.id ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input
                            type="text"
                            placeholder="Actions taken..."
                            value={actionText}
                            onChange={(e) => setActionText(e.target.value)}
                            className="px-2 py-1 rounded border border-gray-300 text-[11px] w-36"
                          />
                          <button
                            onClick={() => handleResolve(h.id)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Confirm Resolve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setResolvingId(null)}
                            className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(h.id)}
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-semibold transition"
                        >
                          Resolve
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] text-gray-400">Resolved</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
