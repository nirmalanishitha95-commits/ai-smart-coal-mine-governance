import React, { useState, useEffect } from "react";
import {
  FileText, Download, Printer, Filter, Calendar, ShieldCheck,
  Building, AlertTriangle, RefreshCw
} from "lucide-react";
import { reportService, mineService } from "../services/api";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("compliance");
  const [mines, setMines] = useState([]);
  const [selectedMineId, setSelectedMineId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reportTypes = [
    { id: "compliance", label: "Statutory Compliance Report" },
    { id: "risk", label: "Mine Risk Assessment Report" },
    { id: "violation", label: "Violations & Penalty Report" },
    { id: "inspection", label: "Inspections Summary Report" },
    { id: "corrective_action", label: "Corrective Action (CAPA) Report" },
  ];

  const fetchReport = () => {
    setLoading(true);
    reportService.getSummary({
      report_type: reportType,
      mine_id: selectedMineId || undefined,
      status: statusFilter || undefined
    })
      .then((res) => setReportData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    mineService.getAll({ limit: 50 }).then((res) => setMines(res.data));
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedMineId, statusFilter]);

  const handlePrint = () => {
    window.print();
  };

  const csvDownloadUrl = reportService.getExportCsvUrl(reportType, selectedMineId, statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Statutory Compliance & Audit Dossier Generator
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Export certified reports for Ministry of Coal and DGMS quarterly statutory evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary text-xs">
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>

          <a
            href={csvDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter / Selector Bar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Dossier Classification</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              {reportTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Filter Mine Asset</label>
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Monitored Mines</option>
              {mines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Filter Record Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="NON-COMPLIANT">Non-Compliant</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generated Report Preview */}
      <div className="gov-card p-6 space-y-4">
        <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5B3A]">
              GOVERNMENT OF INDIA · MINISTRY OF COAL
            </span>
            <h2 className="text-lg font-bold text-[#1F2937] mt-0.5">
              {reportData?.title || "Statutory Compliance Audit Dossier"}
            </h2>
            <p className="text-xs text-[#6B7280]">
              Generated by CoalGuard AI Central Governance Engine · Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>

          <span className="px-3 py-1 rounded text-xs font-bold bg-green-50 text-[#15803D] border border-green-200">
            OFFICIAL ADVISORY RECORD
          </span>
        </div>

        {/* Report Content Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                {reportData?.headers?.map((h, idx) => (
                  <th key={idx}>{h}</th>
                )) || (
                  <>
                    <th>Identifier</th>
                    <th>Mine Asset</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Audit Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-[#6B7280]">
                    Generating compliance audit report...
                  </td>
                </tr>
              ) : reportData?.rows?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-[#6B7280]">
                    No records found matching the report parameters.
                  </td>
                </tr>
              ) : (
                reportData?.rows?.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="text-xs text-[#1F2937]">
                        {cell}
                      </td>
                    ))}
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
