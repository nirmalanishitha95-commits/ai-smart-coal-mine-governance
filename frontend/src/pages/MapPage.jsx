import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  MapPin, AlertTriangle, ShieldCheck, Mountain, ExternalLink,
  RefreshCw, Info
} from "lucide-react";
import { mineService } from "../services/api";
import RiskBadge from "../components/RiskBadge";

// Marker icon generator for Leaflet
const createRiskIcon = (riskLevel) => {
  let color = "#15803D"; // Low
  if (riskLevel === "CRITICAL") color = "#DC2626";
  else if (riskLevel === "HIGH") color = "#EA580C";
  else if (riskLevel === "MEDIUM") color = "#D97706";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background-color: ${color}; opacity: 0.25;"></span>
        <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

export default function MapPage() {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMines = () => {
    setLoading(true);
    mineService.getAll({ limit: 50 })
      .then((res) => setMines(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMines();
  }, []);

  const defaultCenter = [22.8, 83.5];
  const defaultZoom = 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              National Coal Mines GIS Surveillance Map
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
              DEMO GIS DATA
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Geographic overview of monitored coal blocks, regional risk concentrations, and compliance status.
          </p>
        </div>

        <button onClick={fetchMines} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Pins</span>
        </button>
      </div>

      {/* Demo Notice Alert (Requirement 17: Clearly identify demo data) */}
      <div className="gov-card p-3 bg-blue-50/70 border border-blue-200 flex items-center gap-2.5 text-xs text-[#2563EB]">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          <strong>Notice:</strong> This map utilizes representative demonstration coordinates for national coalfields (Dhanbad, Korba, Singrauli, Talcher, Raniganj) for SIH prototype evaluation.
        </span>
      </div>

      {/* Map Container */}
      <div className="gov-card overflow-hidden h-[580px] p-1">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          className="w-full h-full rounded-md"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mines.map((mine) => (
            <Marker
              key={mine.id}
              position={[mine.latitude || 23.75, mine.longitude || 86.42]}
              icon={createRiskIcon(mine.risk_level)}
            >
              <Popup>
                <div className="p-2 space-y-2 text-xs min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
                    <span className="font-bold text-[#1F2937] text-sm">{mine.name}</span>
                    <RiskBadge level={mine.risk_level} score={mine.risk_score} size="sm" />
                  </div>

                  <p className="text-[11px] text-[#6B7280]">
                    {mine.location} · {mine.district}, {mine.state}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100">
                    <div>
                      <span className="text-[#6B7280]">Compliance:</span>
                      <p className="font-bold text-[#1F2937]">{Math.round(mine.compliance_score || 85)}%</p>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Open Alerts:</span>
                      <p className="font-bold text-[#DC2626]">{mine.active_alerts_count || 0}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/mines/${mine.id}`}
                      className="block text-center py-1.5 px-3 bg-[#1E5B3A] text-white text-xs font-semibold rounded hover:bg-[#16462C] transition"
                    >
                      View Mine Profile
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
