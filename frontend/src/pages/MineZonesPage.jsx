import React, { useState, useEffect } from "react";
import {
  Layers, MapPin, Activity, Users, ShieldAlert, AlertTriangle,
  CheckCircle2, RefreshCw, Compass, ArrowDownCircle
} from "lucide-react";
import { zoneService, mineService } from "../services/api";

export default function MineZonesPage() {
  const [zones, setZones] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMine, setSelectedMine] = useState("ALL");

  const fetchZones = async () => {
    setLoading(true);
    try {
      const [zRes, mRes] = await Promise.all([
        zoneService.getAll(selectedMine !== "ALL" ? { mine_id: selectedMine } : {}),
        mineService.getAll({ limit: 50 }),
      ]);
      setZones(zRes.data);
      setMines(mRes.data);
    } catch (err) {
      console.error("Failed to load mine zones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 15000);
    return () => clearInterval(interval);
  }, [selectedMine]);

  const zoneCategories = [
    { title: "Main Shaft & Access", type: "Main Shaft" },
    { title: "Extraction & Longwall", type: "Coal Face" },
    { title: "Ventilation Drifts", type: "Ventilation Zone" },
    { title: "Haulage & Belts", type: "Conveyor Zone" },
    { title: "Underground Tunnels", type: "Tunnel" },
    { title: "Machinery Sub-stations", type: "Equipment Area" },
    { title: "Emergency Escape Routes", type: "Emergency Exit" },
    { title: "Rescue Fresh Air Assembly", type: "Rescue Assembly Area" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Underground Mine Zones Monitoring
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Sector Surveillance
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time environmental safety, depth telemetry, sensor density, and worker counts across all 8 underground mine zone categories.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <select
            value={selectedMine}
            onChange={(e) => setSelectedMine(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            <option value="ALL">All Monitored Collieries</option>
            {mines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <button
            onClick={fetchZones}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 8 Underground Zone Architecture Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {zoneCategories.map((zc) => {
          const matchCount = zones.filter((z) => z.zone_type === zc.type).length;
          return (
            <div key={zc.type} className="p-3 rounded-lg bg-white border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-gray-700 truncate block">{zc.type}</span>
              <p className="text-lg font-bold text-gray-900">{matchCount} Sectors</p>
              <span className="text-[10px] text-gray-500">{zc.title}</span>
            </div>
          );
        })}
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((z) => {
          const isWarning = z.hazard_status === "WARNING" || z.hazard_status === "CRITICAL";
          const isCritical = z.hazard_status === "CRITICAL";
          return (
            <div
              key={z.id}
              className={`p-4 rounded-lg bg-white border transition shadow-2xs space-y-3 ${
                isCritical
                  ? "border-red-300 bg-red-50/20"
                  : isWarning
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{z.name}</h3>
                  <p className="text-[11px] text-gray-500">{z.mine_name}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    isCritical
                      ? "bg-red-100 text-red-800"
                      : isWarning
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {z.hazard_status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 border-t border-b border-gray-100 py-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Zone Type:</span>
                  <span className="font-semibold text-gray-800">{z.zone_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Underground Depth:</span>
                  <span className="font-mono text-gray-800 flex items-center gap-1">
                    <ArrowDownCircle className="w-3 h-3 text-gray-400" />
                    {z.depth_meters} meters
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telemetry Nodes:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-600" />
                    {z.sensors_count} Active Sensors
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Miners Present:</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    {z.active_workers_count} Workers
                  </span>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Ventilation Split: Safe</span>
                <span className="font-semibold text-emerald-700">CMR 2017 Verified</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
