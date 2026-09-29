import React, { useState, useEffect } from "react";
import { History, Shield, Search, Filter, Lock, RefreshCw } from "lucide-react";
import { auditService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuditLogsPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSearch, setActionSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const isAuthorized = role === "SUPER_ADMIN" || role === "GOVERNMENT_OFFICER";

  const fetchLogs = () => {
    if (!isAuthorized) return;
    setLoading(true);
    auditService.getAll({
      action: actionSearch || undefined,
      entity: entityFilter || undefined
    })
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionSearch, entityFilter]);

  if (!isAuthorized) {
    return (
      <div className="gov-card p-12 text-center space-y-3">
        <Lock className="w-10 h-10 text-[#DC2626] mx-auto" />
        <h2 className="text-lg font-bold text-[#1F2937]">Access Restricted</h2>
        <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
          Audit logs are strictly confidential and restricted to Super Admins and DGMS Regulatory Officers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Statutory Governance Audit Trail
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Immutable legal ledger recording all system events, AI anomalies, inspector logins, and violation updates.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action or keywords..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          <div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Entity Types</option>
              <option value="Auth">User Authentication</option>
              <option value="SensorReading">Sensor Reading & Anomaly</option>
              <option value="Inspection">Inspection Audits</option>
              <option value="Violation">Statutory Violation</option>
              <option value="CorrectiveAction">Corrective Action</option>
              <option value="Simulation">AI Risk Simulation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Authorizing Officer / System</th>
                <th>Action Performed</th>
                <th>Target Entity</th>
                <th>Audit Evidence Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-[#6B7280]">
                    Loading statutory audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-[#6B7280]">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-[#6B7280] whitespace-nowrap">
                      {log.timestamp ? log.timestamp.replace("T", " ").slice(0, 19) : "Just now"}
                    </td>
                    <td>
                      <div className="font-semibold text-xs text-[#1F2937]">
                        {log.user_name || "AI System Engine"}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {log.user_email || "system@coalguard.gov.in"}
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-xs text-[#1E5B3A]">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-[#4B5563]">
                        {log.entity} {log.entity_id ? `#${log.entity_id}` : ""}
                      </span>
                    </td>
                    <td className="text-xs text-[#4B5563] max-w-md">
                      <p className="line-clamp-2">{log.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
