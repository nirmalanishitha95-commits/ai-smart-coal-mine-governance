import React, { useState, useEffect } from "react";
import {
  ClipboardCheck, Plus, CheckCircle2, XCircle, AlertTriangle,
  Calendar, User, FileText, ChevronRight, X, Sparkles, RefreshCw
} from "lucide-react";
import { inspectionService, mineService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function InspectionsPage() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    mine_id: 1,
    inspection_type: "Safety Audit",
    scheduled_date: new Date().toISOString().split("T")[0]
  });

  // Digital Checklist Modal
  const [activeInspection, setActiveInspection] = useState(null);
  const checklistQuestions = [
    "Is required personal safety equipment (PPE) available and worn?",
    "Are emergency escape and haulage roadways maintained unobstructed?",
    "Is main mechanical ventilation system operational within volume limits?",
    "Is required statutory mine shift log and fireboss documentation available?",
    "Are environmental multi-gas sensors and water spray monitors functioning?",
    "Are flameproof electrical apparatus standards verified?",
    "Is emergency medical rescue and refuge chamber equipment accessible?"
  ];

  const [checklistAnswers, setChecklistAnswers] = useState({});
  const [overallFinding, setOverallFinding] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [submittingChecklist, setSubmittingChecklist] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      inspectionService.getAll(),
      mineService.getAll({ limit: 50 })
    ])
      .then(([inspRes, minesRes]) => {
        setInspections(inspRes.data);
        setMines(minesRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenChecklist = (insp) => {
    setActiveInspection(insp);
    const defaults = {};
    checklistQuestions.forEach((_, idx) => {
      defaults[idx] = "YES";
    });
    setChecklistAnswers(defaults);
    setOverallFinding("All ventilation and electrical safety parameters inspected under DGMS statutory regulations.");
    setRecommendations("Continue daily airflow readings at Shaft 4 face.");
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inspectionService.schedule({
        mine_id: Number(scheduleForm.mine_id),
        inspection_type: scheduleForm.inspection_type,
        scheduled_date: scheduleForm.scheduled_date
      });
      setShowScheduleModal(false);
      fetchData();
    } catch {
      alert("Failed to schedule inspection.");
    }
  };

  const handleChecklistSubmit = async (e) => {
    e.preventDefault();
    if (!activeInspection) return;
    setSubmittingChecklist(true);

    const findings = checklistQuestions.map((q, idx) => ({
      checklist_item: q,
      answer: checklistAnswers[idx] || "YES",
      severity: checklistAnswers[idx] === "NO" ? "HIGH" : "LOW",
      finding_description: checklistAnswers[idx] === "NO" ? `Non-compliance observed for: ${q}` : "Compliant with statutory standard",
      corrective_action_required: checklistAnswers[idx] === "NO"
    }));

    try {
      await inspectionService.complete(activeInspection.id, {
        overall_finding: overallFinding,
        recommendations: recommendations,
        findings: findings
      });
      setActiveInspection(null);
      fetchData();
    } catch {
      alert("Failed to complete inspection checklist.");
    } finally {
      setSubmittingChecklist(false);
    }
  };

  const upcomingInspections = inspections.filter((i) => i.status === "SCHEDULED" || i.status === "IN PROGRESS");
  const recentInspections = inspections.filter((i) => i.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Statutory Mine Safety Inspections
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            DGMS safety auditing, scheduled field visits, and digital statutory checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Inspection</span>
          </button>
        </div>
      </div>

      {/* Section 1: Upcoming Inspections / Calendar (Requirement 15) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E5B3A]" />
            <h2 className="card-title text-[#1F2937]">Upcoming Inspections ({upcomingInspections.length})</h2>
          </div>
          <span className="text-xs font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 px-2 py-0.5 rounded">
            Scheduled Queue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Scheduled Date</th>
                <th>Mine</th>
                <th>Audit Type</th>
                <th>Assigned Inspector</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {upcomingInspections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-[#6B7280]">
                    No upcoming inspections scheduled. Click "Schedule Inspection" above.
                  </td>
                </tr>
              ) : (
                upcomingInspections.map((insp) => (
                  <tr key={insp.id}>
                    <td>
                      <span className="font-semibold text-xs text-[#1F2937]">
                        {insp.scheduled_date ? insp.scheduled_date.split("T")[0] : "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-xs text-[#1F2937]">
                        {insp.mine?.name}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {insp.mine?.district}, {insp.mine?.state}
                      </div>
                    </td>
                    <td className="text-xs text-[#4B5563]">
                      {insp.inspection_type}
                    </td>
                    <td className="text-xs text-[#4B5563]">
                      {insp.inspector?.name || "Statutory Inspector"}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                        {insp.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenChecklist(insp)}
                        className="btn-primary text-xs !py-1 !px-2.5"
                      >
                        Start Checklist
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Recent Inspections & Findings (Requirement 15) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#15803D]" />
            <h2 className="card-title text-[#1F2937]">Recent Inspections & Findings History ({recentInspections.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Completed Date</th>
                <th>Mine</th>
                <th>Audit Type</th>
                <th>Findings Summary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentInspections.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs text-[#6B7280]">
                    No completed inspections recorded yet.
                  </td>
                </tr>
              ) : (
                recentInspections.map((insp) => (
                  <tr key={insp.id}>
                    <td className="text-xs text-[#6B7280]">
                      {insp.completed_date ? insp.completed_date.split("T")[0] : "Recent"}
                    </td>
                    <td>
                      <div className="font-semibold text-xs text-[#1F2937]">
                        {insp.mine?.name}
                      </div>
                    </td>
                    <td className="text-xs text-[#4B5563]">
                      {insp.inspection_type}
                    </td>
                    <td>
                      <div className="text-xs text-[#1F2937] line-clamp-1">
                        {insp.overall_finding || "Routine examination complete. All parameters compliant."}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {insp.findings?.length || 7} questionnaire items recorded
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#15803D]">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Inspection Modal (Requirement 15: Clean Form) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gov-card w-full max-w-md p-6 animate-fadeIn shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="card-title text-[#1F2937]">Schedule Statutory Mine Inspection</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Target Mine</label>
                <select
                  value={scheduleForm.mine_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, mine_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                >
                  {mines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Inspection Classification</label>
                <select
                  value={scheduleForm.inspection_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, inspection_type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                >
                  <option value="Safety Audit">Safety Audit (Comprehensive)</option>
                  <option value="Ventilation Inspection">Ventilation & Multi-Gas Audit</option>
                  <option value="Electrical & Machinery">Electrical & Machinery Certification</option>
                  <option value="Environmental Compliance">Environmental & PM10 Inspection</option>
                  <option value="Emergency Preparedness">Emergency Preparedness & Rescue Drill</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Audit Scheduled Date</label>
                <input
                  type="date"
                  value={scheduleForm.scheduled_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Schedule Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Checklist Modal */}
      {activeInspection && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gov-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="card-title text-[#1F2937]">Digital Inspection Checklist</h3>
                <p className="text-xs text-[#6B7280]">
                  Mine: <strong className="text-[#1F2937]">{activeInspection.mine?.name}</strong> · Audit Type: {activeInspection.inspection_type}
                </p>
              </div>
              <button onClick={() => setActiveInspection(null)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChecklistSubmit} className="mt-4 space-y-4">
              <div className="space-y-3">
                {checklistQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-[#F5F7FA] rounded-md border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#1F2937] flex-1">
                      {idx + 1}. {q}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {["YES", "NO", "N/A"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setChecklistAnswers({ ...checklistAnswers, [idx]: opt })}
                          className={`px-3 py-1 rounded text-xs font-bold transition ${
                            checklistAnswers[idx] === opt
                              ? opt === "YES"
                                ? "bg-[#15803D] text-white"
                                : opt === "NO"
                                ? "bg-[#DC2626] text-white"
                                : "bg-gray-600 text-white"
                              : "bg-white text-[#6B7280] border border-gray-200 hover:text-[#1F2937]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Overall Auditor Finding</label>
                <textarea
                  rows="2"
                  value={overallFinding}
                  onChange={(e) => setOverallFinding(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Statutory Recommendations & Directives</label>
                <textarea
                  rows="2"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveInspection(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChecklist}
                  className="btn-primary text-xs"
                >
                  {submittingChecklist ? "Submitting..." : "Submit Digital Statutory Sign-Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
