import React, { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, Calendar, Filter, Activity,
  ShieldCheck, AlertTriangle, CheckSquare, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { analyticsService } from "../services/api";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    analyticsService.getAnalytics({ range })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const ranges = [
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "3m", label: "3 Months" },
    { id: "6m", label: "6 Months" },
    { id: "1y", label: "1 Year" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Executive Mining Compliance & Predictive Risk Analytics
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Fleet compliance trajectory, statutory enforcement velocity, and multi-factor hazard patterns.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1 rounded-md border border-gray-200">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                range === r.id
                  ? "bg-[#1E5B3A] text-white shadow-2xs"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trajectory */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div>
              <h3 className="card-title text-[#1F2937]">Compliance Trajectory & Statutory Target</h3>
              <p className="text-caption text-xs text-[#6B7280]">Score progress versus mandatory 85% requirement</p>
            </div>
          </div>
          <div className="gov-card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.compliance_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 11 }} />
                <YAxis domain={[70, 100]} stroke="#6B7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: "6px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Fleet Score (%)"
                  stroke="#1E5B3A"
                  fill="#1E5B3A"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Statutory Baseline (85%)"
                  stroke="#D97706"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations by Category */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div>
              <h3 className="card-title text-[#1F2937]">Violations by Regulatory Category</h3>
              <p className="text-caption text-xs text-[#6B7280]">Distribution across statutory compliance areas</p>
            </div>
          </div>
          <div className="gov-card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.violations_by_category || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="category" stroke="#6B7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: "6px", fontSize: "12px" }}
                />
                <Bar dataKey="count" name="Violations" fill="#1E5B3A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
