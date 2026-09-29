import React, { useState, useEffect } from "react";
import {
  AlertOctagon, Search, Filter, Eye, Edit2, X, AlertTriangle,
  Clock, DollarSign, User, Calendar, RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import { violationService, mineService } from "../services/api";

export default function ViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [mineFilter, setMineFilter] = useState("");

  // Pagination (Requirement 14)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit / Details Modal
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [editStatus, setEditStatus] = useState("OPEN");
  const [editFine, setEditFine] = useState(0);
  const [editOfficer, setEditOfficer] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      violationService.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        mine_id: mineFilter || undefined
      }),
      mineService.getAll({ limit: 50 })
    ])
      .then(([vRes, mRes]) => {
        setViolations(vRes.data);
        setMines(mRes.data);
        setCurrentPage(1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, severityFilter, mineFilter]);

  const handleOpenEdit = (v) => {
    setSelectedViolation(v);
    setEditStatus(v.status);
    setEditFine(v.fine_amount || 0);
    setEditOfficer(v.assigned_officer || "DGMS Field Officer");
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedViolation) return;
    try {
      await violationService.update(selectedViolation.id, {
        status: editStatus,
        fine_amount: editFine,
        assigned_officer: editOfficer
      });
      setSelectedViolation(null);
      fetchData();
    } catch {
      alert("Failed to update regulatory violation.");
    }
  };

  // Pagination slice
  const totalPages = Math.ceil(violations.length / itemsPerPage) || 1;
  const paginatedViolations = violations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Regulatory Mining Violations Registry
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Statutory notices issued under the Mines Act, 1952 and Coal Mines Regulations, 2017.
          </p>
        </div>

        <button onClick={fetchData} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Violations</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, category, or mine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER REVIEW">Under Review</option>
              <option value="CORRECTIVE ACTION">Corrective Action</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <select
              value={mineFilter}
              onChange={(e) => setMineFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Mines</option>
              {mines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Professional Data Table (Requirement 14: Violation ID | Mine | Category | Severity | Detected | Due Date | Status | Assigned Officer | Action) */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Violation ID</th>
                <th>Mine</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Detected</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Assigned Officer</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-[#6B7280]">
                    Loading regulatory violations...
                  </td>
                </tr>
              ) : paginatedViolations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-[#6B7280]">
                    No violations found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedViolations.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-[#1F2937]">
                        {v.violation_code}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-xs text-[#1F2937]">
                        {v.mine?.name}
                      </div>
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
                    <td className="text-xs text-[#6B7280]">
                      {v.detected_date ? v.detected_date.split("T")[0] : "Recent"}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {v.due_date ? v.due_date.split("T")[0] : "30-Day SLA"}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === "RESOLVED" || v.status === "CLOSED"
                            ? "bg-green-100 text-[#15803D]"
                            : v.status === "CORRECTIVE ACTION"
                            ? "bg-blue-100 text-[#2563EB]"
                            : "bg-amber-100 text-[#D97706]"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="text-xs text-[#4B5563]">
                      {v.assigned_officer || "DGMS Field Officer"}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 hover:bg-[#1E5B3A]/20 rounded transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            Showing {violations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, violations.length)} of {violations.length} violations
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-[#1F2937]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Violation Detail / Action Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gov-card w-full max-w-lg p-6 animate-fadeIn shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#DC2626]">
                  {selectedViolation.violation_code}
                </span>
                <h3 className="card-title text-[#1F2937] mt-0.5">
                  Statutory Violation Review
                </h3>
              </div>
              <button onClick={() => setSelectedViolation(null)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#F5F7FA] rounded-md border border-gray-200">
                <span className="font-semibold text-[#1F2937]">Description of Violation:</span>
                <p className="mt-1 text-[#4B5563]">{selectedViolation.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#6B7280]">Mine:</span>
                  <p className="font-semibold text-[#1F2937] mt-0.5">{selectedViolation.mine?.name}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Category:</span>
                  <p className="font-semibold text-[#1F2937] mt-0.5">{selectedViolation.category}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-3 pt-3 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Enforcement Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                >
                  <option value="OPEN">Open</option>
                  <option value="UNDER REVIEW">Under Review</option>
                  <option value="CORRECTIVE ACTION">Corrective Action Assigned</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed (Signed off)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Assigned Statutory Officer</label>
                <input
                  type="text"
                  value={editOfficer}
                  onChange={(e) => setEditOfficer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Statutory Fine / Penalty (INR)</label>
                <input
                  type="number"
                  value={editFine}
                  onChange={(e) => setEditFine(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedViolation(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Update Enforcement Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
