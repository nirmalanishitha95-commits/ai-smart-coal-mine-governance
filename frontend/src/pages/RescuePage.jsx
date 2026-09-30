import React, { useState, useEffect } from "react";
import {
  LifeBuoy, ShieldAlert, Users, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, ChevronRight, Activity, MapPin, Radio, ArrowUpRight
} from "lucide-react";
import { rescueService } from "../services/api";

export default function RescuePage() {
  const [operations, setOperations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchRescueData = async () => {
    setLoading(true);
    try {
      const [opsRes, teamsRes] = await Promise.all([
        rescueService.getOperations(),
        rescueService.getTeams(),
      ]);
      setOperations(opsRes.data);
      setTeams(teamsRes.data);
      if (opsRes.data.length > 0 && !selectedOp) {
        setSelectedOp(opsRes.data[0]);
      }
    } catch (err) {
      console.error("Failed to load rescue operations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRescueData();
    const interval = setInterval(fetchRescueData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (opId, newStatus) => {
    setStatusUpdating(true);
    try {
      await rescueService.updateOperationStatus(opId, newStatus, `Status transitioned to ${newStatus} by Mine Rescue Commander`);
      await fetchRescueData();
    } catch (err) {
      alert("Failed to update operation status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const activeOps = operations.filter((o) => o.status !== "RESOLVED");
  const resolvedOps = operations.filter((o) => o.status === "RESOLVED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Emergency Rescue Management & Operations
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded-full border border-red-200">
              Live Mission Control
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch rescue teams, track underground extraction progress, and coordinate life-saving interventions.
          </p>
        </div>

        <button
          onClick={fetchRescueData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          Refresh Operations
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Rescue Operations</span>
            <LifeBuoy className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeOps.length}</p>
          <span className="text-[11px] font-medium text-red-600">Urgent Mobilization</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Standby Rescue Squads</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{teams.length}</p>
          <span className="text-[11px] font-medium text-emerald-600">SCBA Certified Teams</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Affected Personnel In Ops</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {activeOps.reduce((sum, o) => sum + (o.affected_workers_count || 0), 0)}
          </p>
          <span className="text-[11px] font-medium text-amber-600">Tracked in zones</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Resolved Rescues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{resolvedOps.length}</p>
          <span className="text-[11px] font-medium text-gray-500">Safely evacuated</span>
        </div>
      </div>

      {/* Main Grid: Active Missions & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Operations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Underground Rescue Operations Tracking</span>
              <span className="text-xs text-gray-500">Total: {operations.length}</span>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-xs text-gray-500">Loading operations...</div>
            ) : operations.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">No active rescue operations recorded.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {operations.map((op) => {
                  const isSelected = selectedOp?.id === op.id;
                  const isCritical = op.severity === "CRITICAL";
                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedOp(op)}
                      className={`p-3.5 rounded-lg cursor-pointer transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-50/60 border border-emerald-300"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-900">{op.operation_code}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              op.status === "RESCUE IN PROGRESS"
                                ? "bg-red-100 text-red-700 animate-pulse"
                                : op.status === "ACTIVE"
                                ? "bg-amber-100 text-amber-700"
                                : op.status === "RESOLVED"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {op.status}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${
                              isCritical ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                          >
                            {op.severity}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-gray-800">{op.incident_title}</p>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {op.mine_name} · {op.target_zone}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <Users className="w-3 h-3" />
                            {op.affected_workers_count} Workers Affected
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] text-gray-400">
                          {new Date(op.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rescue Teams Registered */}
          <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Registered Mine Rescue Squads (CMR 2017)</span>
              <span className="text-xs text-gray-500">{teams.length} Squads</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {teams.map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{t.team_name}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">Leader: <span className="font-semibold text-gray-800">{t.leader_name}</span></p>
                  <p className="text-[10px] text-gray-500">Base: {t.mine_name}</p>
                  <div className="pt-1 text-[10px] text-gray-500 border-t border-gray-200/60">
                    <span className="font-medium text-gray-700">Equip:</span> {t.equipment_specialization}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Operation Detail & Action Panel */}
        <div className="space-y-4">
          {selectedOp ? (
            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mission Details</span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">{selectedOp.operation_code}</h3>
                <p className="text-xs text-gray-600">{selectedOp.incident_title}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Colliery / Mine:</span>
                  <span className="font-semibold text-gray-900">{selectedOp.mine_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Target Underground Zone:</span>
                  <span className="font-semibold text-gray-900">{selectedOp.target_zone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Assigned Rescue Squad:</span>
                  <span className="font-semibold text-emerald-700">{selectedOp.rescue_team_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Squad Commander:</span>
                  <span className="font-semibold text-gray-900">{selectedOp.rescue_leader}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Trapped / Affected Miners:</span>
                  <span className="font-bold text-red-600">{selectedOp.affected_workers_count} Workers</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700">Actions & Interventions Taken:</span>
                <p className="mt-1 p-2.5 rounded bg-gray-50 text-xs text-gray-700 leading-relaxed border border-gray-200">
                  {selectedOp.actions_taken || "Deploying atmospheric test probes and preparing emergency breathing apparatus."}
                </p>
              </div>

              {/* Status Update Control */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700 mb-2 block">Update Rescue Status:</span>
                <div className="grid grid-cols-2 gap-2">
                  {["RESPONDING", "RESCUE IN PROGRESS", "RESOLVED"].map((st) => (
                    <button
                      key={st}
                      disabled={statusUpdating || selectedOp.status === st}
                      onClick={() => handleUpdateStatus(selectedOp.id, st)}
                      className={`px-2.5 py-1.5 rounded text-xs font-semibold transition ${
                        selectedOp.status === st
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-white border border-gray-200 text-center text-xs text-gray-500">
              Select an operation to view tactical dispatch details.
            </div>
          )}

          {/* Statutory Safety Protocol Box */}
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              Underground Rescue Protocol
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              In accordance with DGMS Coal Mines Regulations 2017, all rescue crews must maintain continuous communication with the fresh air base and withdraw if return airway carbon monoxide exceeds 50 ppm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
