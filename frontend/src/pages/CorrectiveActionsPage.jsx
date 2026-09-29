import React, { useState, useEffect } from "react";
import {
  CheckSquare, AlertCircle, Clock, CheckCircle2, Upload, FileText,
  ShieldCheck, X, RefreshCw
} from "lucide-react";
import { correctiveActionService, mineService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CorrectiveActionsPage() {
  const { role } = useAuth();
  const [actions, setActions] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [mineFilter, setMineFilter] = useState("");

  // Evidence / Verification Modal
  const [selectedAction, setSelectedAction] = useState(null);
  const [modalMode, setModalMode] = useState("evidence"); // "evidence" or "verify"
  const [evidenceName, setEvidenceName] = useState("");
  const [officerNotes, setOfficerNotes] = useState("");
  const [verificationDecision, setVerificationDecision] = useState("COMPLETED");

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      correctiveActionService.getAll({
        status: statusFilter || undefined,
        overdue_only: overdueOnly || undefined,
        mine_id: mineFilter || undefined
      }),
      mineService.getAll({ limit: 50 })
    ])
      .then(([caRes, mRes]) => {
        setActions(caRes.data);
        setMines(mRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, overdueOnly, mineFilter]);

  const handleOpenAction = (action, mode) => {
    setSelectedAction(action);
    setModalMode(mode);
    setEvidenceName(action.evidence || "CERT-REMED-2026.pdf");
    setOfficerNotes(action.officer_notes || "");
    setVerificationDecision("COMPLETED");
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!selectedAction) return;
    try {
      await correctiveActionService.submitEvidence(selectedAction.id, {
        evidence: evidenceName
      });
      setSelectedAction(null);
      fetchData();
    } catch {
      alert("Failed to submit evidence.");
    }
  };

  const handleVerifyAction = async (e) => {
    e.preventDefault();
    if (!selectedAction) return;
    try {
      await correctiveActionService.verify(selectedAction.id, {
        status: verificationDecision,
        officer_notes: officerNotes
      });
      setSelectedAction(null);
      fetchData();
    } catch {
      alert("Failed to verify corrective action.");
    }
  };

  const isOfficer = role === "SUPER_ADMIN" || role === "GOVERNMENT_OFFICER";
  const isManager = role === "MINE_MANAGER" || isOfficer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Corrective & Remedial Action Plans (CAPA)
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Enforcing statutory remediation SLAs, evidence verification, and closed-loop risk restoration.
          </p>
        </div>

        <button onClick={fetchData} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Actions</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Action Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Mine</label>
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

          <div className="sm:col-span-2 flex items-end">
            <label className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-[#F5F7FA] border border-gray-200 text-xs text-[#1F2937] cursor-pointer w-full">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded border-gray-300 text-[#DC2626] focus:ring-[#DC2626]"
              />
              <span className="font-semibold text-[#DC2626]">Show Overdue Actions Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Corrective Actions Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Action ID & Violation</th>
                <th>Mine</th>
                <th>Remedial Description</th>
                <th>Assigned Person</th>
                <th>SLA Due Date</th>
                <th>Status</th>
                <th>Evidence</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-xs text-[#6B7280]">
                    Loading corrective action plans...
                  </td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-xs text-[#6B7280]">
                    No corrective action records found.
                  </td>
                </tr>
              ) : (
                actions.map((act) => {
                  const isOverdue = act.status === "OVERDUE" || (new Date(act.due_date) < new Date() && act.status !== "COMPLETED");

                  return (
                    <tr key={act.id}>
                      <td>
                        <div className="font-mono text-xs font-bold text-[#1F2937]">
                          {act.action_code || `CAPA-${act.id}`}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B7280]">
                          Viol: {act.violation?.violation_code || "CMR Sec 153"}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-xs text-[#1F2937]">
                          {act.mine?.name}
                        </div>
                      </td>
                      <td className="text-xs text-[#4B5563] max-w-xs">
                        <p className="line-clamp-2">{act.description}</p>
                      </td>
                      <td className="text-xs text-[#4B5563]">
                        {act.assigned_person}
                      </td>
                      <td>
                        <div className="text-xs text-[#1F2937]">
                          {act.due_date ? act.due_date.split("T")[0] : "SLA"}
                        </div>
                        {isOverdue && act.status !== "COMPLETED" && (
                          <span className="text-[10px] font-bold text-[#DC2626] block">Overdue</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.status === "COMPLETED"
                              ? "bg-green-100 text-[#15803D]"
                              : act.status === "SUBMITTED"
                              ? "bg-purple-100 text-purple-700"
                              : act.status === "IN PROGRESS"
                              ? "bg-blue-100 text-[#2563EB]"
                              : isOverdue
                              ? "bg-red-100 text-[#DC2626]"
                              : "bg-amber-100 text-[#D97706]"
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td>
                        {act.evidence ? (
                          <span className="text-xs text-[#1E5B3A] font-medium flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[100px]">{act.evidence}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#9CA3AF]">Pending</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isManager && act.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleOpenAction(act, "evidence")}
                              className="px-2 py-1 text-xs font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 hover:bg-[#1E5B3A]/20 rounded transition"
                              title="Upload compliance rectification evidence"
                            >
                              Upload Evidence
                            </button>
                          )}
                          {isOfficer && act.status === "SUBMITTED" && (
                            <button
                              onClick={() => handleOpenAction(act, "verify")}
                              className="px-2 py-1 text-xs font-semibold text-white bg-[#15803D] hover:bg-green-800 rounded transition"
                              title="Statutory verification and sign-off"
                            >
                              Verify & Sign-Off
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Upload Evidence or Verify */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gov-card w-full max-w-md p-6 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="card-title text-[#1F2937]">
                {modalMode === "evidence" ? "Upload Remediation Evidence" : "Statutory Verification Sign-Off"}
              </h3>
              <button onClick={() => setSelectedAction(null)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-xs space-y-1">
              <p className="font-semibold text-[#1F2937]">Action: {selectedAction.action_code}</p>
              <p className="text-[#6B7280]">{selectedAction.description}</p>
            </div>

            {modalMode === "evidence" ? (
              <form onSubmit={handleSubmitEvidence} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Evidence Certificate ID / Filename</label>
                  <input
                    type="text"
                    required
                    value={evidenceName}
                    onChange={(e) => setEvidenceName(e.target.value)}
                    placeholder="e.g. DGMS-FLAMEPROOF-CERT-2026.pdf"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Upload flameproof equipment calibration certificates or statutory airflow logs.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setSelectedAction(null)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs">
                    Submit Remediation Evidence
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAction} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Auditor Verification Decision</label>
                  <select
                    value={verificationDecision}
                    onChange={(e) => setVerificationDecision(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  >
                    <option value="COMPLETED">Approve Remediation (Close Violation)</option>
                    <option value="IN PROGRESS">Reject Evidence (Require Additional Remediation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">DGMS Statutory Sign-Off Notes</label>
                  <textarea
                    rows="3"
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Enter compliance verification findings..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setSelectedAction(null)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs !bg-[#15803D]">
                    Authorize Statutory Sign-Off
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
