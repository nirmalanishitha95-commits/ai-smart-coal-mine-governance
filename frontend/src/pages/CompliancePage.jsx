import React, { useState, useEffect } from "react";
import {
  ShieldCheck, Search, Filter, CheckCircle, AlertTriangle, Clock,
  FileText, ExternalLink, Edit3, X, RefreshCw, Calendar
} from "lucide-react";
import { complianceService, mineService } from "../services/api";

export default function CompliancePage() {
  const [records, setRecords] = useState([]);
  const [rules, setRules] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (Requirement 13)
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [mineFilter, setMineFilter] = useState("");

  // Edit / Action Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editStatus, setEditStatus] = useState("COMPLIANT");
  const [editRemarks, setEditRemarks] = useState("");
  const [editEvidence, setEditEvidence] = useState("");

  const categories = [
    "Safety", "Environmental", "Equipment", "Labour",
    "Documentation", "Emergency preparedness", "Operational compliance"
  ];

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      complianceService.getRecords({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        mine_id: mineFilter || undefined
      }),
      complianceService.getRules(),
      mineService.getAll({ limit: 50 })
    ])
      .then(([recRes, rulesRes, minesRes]) => {
        setRecords(recRes.data);
        setRules(rulesRes.data);
        setMines(minesRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter, mineFilter]);

  const handleOpenEdit = (rec) => {
    setSelectedRecord(rec);
    setEditStatus(rec.status);
    setEditRemarks(rec.remarks || "");
    setEditEvidence(rec.evidence || "");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await complianceService.updateRecord(selectedRecord.id, {
        status: editStatus,
        remarks: editRemarks,
        evidence: editEvidence
      });
      setSelectedRecord(null);
      fetchData();
    } catch {
      alert("Failed to update compliance record.");
    }
  };

  // Status badges as requested by Section 13: COMPLIANT | PARTIAL | NON-COMPLIANT | PENDING
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLIANT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">COMPLIANT</span>;
      case "PARTIALLY COMPLIANT":
      case "PARTIAL":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">PARTIAL</span>;
      case "NON-COMPLIANT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">NON-COMPLIANT</span>;
      case "PENDING REVIEW":
      case "PENDING":
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">PENDING</span>;
    }
  };

  // Client-side search and date filtering
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.rule?.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rule?.rule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mine?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || (r.due_date && r.due_date.startsWith(dateFilter));

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Statutory Compliance Governance Registry
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            DGMS, MoEFCC, and Central Electricity Authority mining regulations compliance tracking.
          </p>
        </div>

        <button onClick={fetchData} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter Toolbar (Search, Filter, Date filter, Category filter, Status filter) */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search rule or mine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Statuses</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="PARTIALLY COMPLIANT">Partial</option>
              <option value="NON-COMPLIANT">Non-Compliant</option>
              <option value="PENDING REVIEW">Pending</option>
            </select>
          </div>

          {/* Mine Filter */}
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

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>
        </div>
      </div>

      {/* Professional Compliance Data Table (Requirement 13) */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Category</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Last Verified</th>
                <th>Evidence</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs text-[#6B7280]">
                    Loading compliance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs text-[#6B7280]">
                    No compliance records found for selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-semibold text-xs text-[#1F2937]">
                        {r.rule?.rule_name || "Statutory Rule"}
                      </div>
                      <div className="font-mono text-[11px] text-[#6B7280]">
                        {r.rule?.rule_code} · <span className="text-[#1E5B3A]">{r.mine?.name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {r.rule?.category}
                    </td>
                    <td>
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {r.due_date ? r.due_date.split("T")[0] : "Annual Review"}
                    </td>
                    <td className="text-xs text-[#6B7280]">
                      {r.last_verified ? r.last_verified.split("T")[0] : "Pending Audit"}
                    </td>
                    <td>
                      {r.evidence ? (
                        <span className="text-xs text-[#1E5B3A] font-medium flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{r.evidence}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#9CA3AF]">No attachment</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEdit(r)}
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
      </div>

      {/* Edit Compliance Verification Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gov-card w-full max-w-md p-6 animate-fadeIn shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="card-title text-[#1F2937]">Compliance Verification Review</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-[#6B7280]">Rule Code & Name:</span>
                <p className="text-xs font-semibold text-[#1F2937] mt-0.5">
                  {selectedRecord.rule?.rule_code}: {selectedRecord.rule?.rule_name}
                </p>
                <p className="text-[11px] text-[#1E5B3A] font-medium">Mine: {selectedRecord.mine?.name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Compliance Determination</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                >
                  <option value="COMPLIANT">Compliant</option>
                  <option value="PARTIALLY COMPLIANT">Partial</option>
                  <option value="NON-COMPLIANT">Non-Compliant</option>
                  <option value="PENDING REVIEW">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Evidence Certificate / File ID</label>
                <input
                  type="text"
                  value={editEvidence}
                  onChange={(e) => setEditEvidence(e.target.value)}
                  placeholder="e.g. DGMS-CERT-VENT-2026.pdf"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Inspector Verification Remarks</label>
                <textarea
                  rows="3"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Enter statutory verification findings..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Save Verification Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
