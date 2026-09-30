import React, { useState, useEffect } from "react";
import {
  Users, HeartPulse, Thermometer, BatteryCharging, Radio,
  ShieldCheck, AlertTriangle, RefreshCw, Filter, CheckCircle2,
  MapPin, ShieldAlert, ArrowRightLeft
} from "lucide-react";
import { workerService, mineService } from "../services/api";

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMine, setFilterMine] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const [wRes, mRes] = await Promise.all([
        workerService.getAll(filterMine !== "ALL" ? { mine_id: filterMine } : {}),
        mineService.getAll({ limit: 50 }),
      ]);
      setWorkers(wRes.data);
      setMines(mRes.data);
    } catch (err) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 12000);
    return () => clearInterval(interval);
  }, [filterMine]);

  const handleStatusChange = async (workerId, newStatus) => {
    setStatusUpdating(true);
    try {
      await workerService.updateStatus(workerId, newStatus);
      await fetchWorkers();
    } catch (err) {
      alert("Failed to update worker status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    if (filterStatus !== "ALL" && w.status !== filterStatus) return false;
    return true;
  });

  const safeCount = workers.filter((w) => w.status === "SAFE").length;
  const warningCount = workers.filter((w) => w.status === "WARNING").length;
  const atRiskCount = workers.filter((w) => w.status === "AT RISK").length;
  const emergencyCount = workers.filter((w) => w.status === "EMERGENCY").length;
  const evacuatedCount = workers.filter((w) => w.status === "EVACUATED" || w.status === "RESCUED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Underground Worker Safety Monitoring
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Live Biometrics & Beacons
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time biometric vital signs, radio beacon positioning, and evacuation status tracking for underground miners.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-md">
            LOCATION SOURCE: DEMO WORKER LOCATION
          </span>
          <button
            onClick={fetchWorkers}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500">Total Monitored</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{workers.length}</p>
          <span className="text-[10px] text-gray-400">Underground miners</span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500">Status: Safe</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{safeCount}</p>
          <span className="text-[10px] text-emerald-600">Nominal vitals</span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500">Status: Warning</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{warningCount}</p>
          <span className="text-[10px] text-amber-600">Minor elevation</span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500">At Risk / Emergency</span>
          <p className="text-xl font-bold text-red-600 mt-1">{atRiskCount + emergencyCount}</p>
          <span className="text-[10px] text-red-600">Priority intervention</span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500">Evacuated / Rescued</span>
          <p className="text-xl font-bold text-blue-600 mt-1">{evacuatedCount}</p>
          <span className="text-[10px] text-blue-600">At fresh air base</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>

        <select
          value={filterMine}
          onChange={(e) => setFilterMine(e.target.value)}
          className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 text-xs focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">All Underground Mines</option>
          {mines.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 text-xs focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">All Safety Statuses</option>
          <option value="SAFE">SAFE</option>
          <option value="WARNING">WARNING</option>
          <option value="AT RISK">AT RISK</option>
          <option value="EMERGENCY">EMERGENCY</option>
          <option value="EVACUATED">EVACUATED</option>
          <option value="RESCUED">RESCUED</option>
        </select>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Worker Code & Name</th>
                <th className="py-3 px-4">Role & Shift</th>
                <th className="py-3 px-4">Colliery & Zone</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-4">Biometrics</th>
                <th className="py-3 px-4">Beacon Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWorkers.map((w) => {
                const isEmergency = w.status === "EMERGENCY" || w.status === "AT RISK";
                return (
                  <tr key={w.id} className={`hover:bg-gray-50/80 transition ${isEmergency ? "bg-red-50/30" : ""}`}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{w.name}</div>
                      <div className="font-mono text-[11px] text-gray-500">{w.worker_code}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-gray-800">{w.role}</div>
                      <div className="text-[10px] text-gray-500">{w.shift}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{w.mine_name}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {w.assigned_zone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === "SAFE"
                            ? "bg-emerald-100 text-emerald-800"
                            : w.status === "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : w.status === "AT RISK"
                            ? "bg-orange-100 text-orange-800"
                            : w.status === "EMERGENCY"
                            ? "bg-red-100 text-red-800 animate-pulse font-extrabold"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-gray-700">
                          <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                          {w.heart_rate ? `${w.heart_rate} bpm` : "--"}
                        </span>
                        <span className="flex items-center gap-1 text-gray-700">
                          <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                          {w.body_temperature ? `${w.body_temperature}°C` : "--"}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                          <BatteryCharging className="w-3 h-3 text-emerald-500" />
                          {w.battery_level}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                        <Radio className="w-3 h-3 text-emerald-600" />
                        {w.last_beacon}
                      </div>
                      <span className="text-[9px] text-amber-700 font-semibold">{w.location_mode}</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <select
                        disabled={statusUpdating}
                        value={w.status}
                        onChange={(e) => handleStatusChange(w.id, e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 bg-white text-[11px] font-medium text-gray-700 hover:border-emerald-500 focus:outline-none"
                      >
                        <option value="SAFE">SAFE</option>
                        <option value="WARNING">WARNING</option>
                        <option value="AT RISK">AT RISK</option>
                        <option value="EMERGENCY">EMERGENCY</option>
                        <option value="EVACUATED">EVACUATED</option>
                        <option value="RESCUED">RESCUED</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
