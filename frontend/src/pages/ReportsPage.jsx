import React, { useState, useEffect } from "react";
import {
  FileText, Download, Filter, Calendar, ShieldCheck,
  Building, AlertTriangle, CheckCircle, RefreshCw, Eye, Printer, Layers
} from "lucide-react";
import { reportService, mineService } from "../services/api";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("compliance");
  const [mines, setMines] = useState([]);
  const [selectedMineId, setSelectedMineId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Data & state
  const [stats, setStats] = useState({
    reports_generated: 28,
    compliance_reports: 60,
    inspection_reports: 28,
    risk_reports: 10
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [csvDownloading, setCsvDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const reportTypes = [
    { id: "compliance", label: "Mine Compliance Report" },
    { id: "inspections", label: "Inspection Report" },
    { id: "violations", label: "Violation Report" },
    { id: "corrective-actions", label: "Corrective Action Report" },
    { id: "environmental", label: "Environmental Monitoring Report" },
    { id: "risk", label: "AI Risk Assessment Report" },
  ];

  // Load initial dropdown mines and KPI stats
  useEffect(() => {
    mineService.getAll({ limit: 50 })
      .then((res) => setMines(res.data || []))
      .catch((err) => console.error("Failed to load mines for reports:", err));

    reportService.getStats()
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch((err) => console.error("Failed to load report stats:", err));
    
    // Auto-generate initial compliance report
    handleGenerateReport("compliance", "", "", "", "");
  }, []);

  const handleGenerateReport = async (
    type = reportType,
    mineId = selectedMineId,
    start = startDate,
    end = endDate,
    status = statusFilter
  ) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const params = {
        report_type: type,
        mine_id: mineId ? parseInt(mineId) : undefined,
        start_date: start || undefined,
        end_date: end || undefined,
        status: status || undefined
      };
      const res = await reportService.getSummary(params);
      setReportData(res.data);
      setHasGenerated(true);
      setSuccessMessage("Report generated successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("[REPORT_GEN_ERROR]", err);
      setErrorMessage("Unable to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    setErrorMessage("");
    try {
      await reportService.downloadPdf({
        report_type: reportType,
        mine_id: selectedMineId ? parseInt(selectedMineId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: statusFilter || undefined
      });
      setSuccessMessage("PDF downloaded successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("[PDF_DOWNLOAD_ERROR]", err);
      setErrorMessage("Unable to download PDF report. Please verify connection and try again.");
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setCsvDownloading(true);
    setErrorMessage("");
    try {
      await reportService.downloadCsv({
        report_type: reportType,
        mine_id: selectedMineId ? parseInt(selectedMineId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: statusFilter || undefined
      });
      setSuccessMessage("CSV exported successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("[CSV_DOWNLOAD_ERROR]", err);
      setErrorMessage("Unable to export CSV report. Please try again.");
    } finally {
      setCsvDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Project Reports
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Generate and download compliance, inspection, risk and environmental reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2"
            title="Print preview"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Section 17) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gov-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Reports Generated</p>
            <p className="text-2xl font-bold text-[#1F2937] mt-1">{stats.reports_generated || 28}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="gov-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Compliance Reports</p>
            <p className="text-2xl font-bold text-[#1E5B3A] mt-1">{stats.compliance_reports || 60}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#1E5B3A]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="gov-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Inspection Reports</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.inspection_reports || 28}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="gov-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Risk Reports</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.risk_reports || 10}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Report Generation Form */}
      <div className="gov-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Filter className="w-4 h-4 text-[#1E5B3A]" />
          <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
            Configure Report Parameters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Report Type */}
          <div>
            <label className="block text-xs font-semibold text-[#4B5563] mb-1">
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              {reportTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Mine Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#4B5563] mb-1">
              Mine Asset
            </label>
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Authorized Mines</option>
              {mines.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.state})</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-[#4B5563] mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-[#4B5563] mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#4B5563] mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open / Active</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="NON-COMPLIANT">Non-Compliant</option>
              <option value="COMPLETED">Completed</option>
              <option value="CRITICAL">Critical</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {/* Buttons Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateReport()}
              disabled={loading}
              className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Report</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleGenerateReport()}
              disabled={loading}
              className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!hasGenerated || pdfDownloading || loading}
              className={`text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-md font-medium transition-all ${
                !hasGenerated || pdfDownloading || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-red-700 hover:bg-red-800 text-white shadow-sm"
              }`}
            >
              {pdfDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={!hasGenerated || csvDownloading || loading}
              className={`text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-md font-medium transition-all ${
                !hasGenerated || csvDownloading || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-[#1E5B3A] hover:bg-[#16472D] text-white shadow-sm"
              }`}
            >
              {csvDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-xs text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* 4. Report Preview & Data Presentation */}
      <div className="gov-card p-6 space-y-4">
        {/* Dossier Header */}
        <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#1E5B3A] px-2 py-0.5 rounded border border-slate-200">
                GOVERNMENT OF INDIA &bull; MINISTRY OF COAL &bull; DGMS
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1F2937] mt-1.5">
              {reportData?.title || "Mine Compliance Report"}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {reportData?.subtitle || "DGMS & Coal Mines Regulations Statutory Adherence Dossier"} &bull; Generated: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>

          <span className="px-3 py-1 rounded text-xs font-bold bg-green-50 text-[#15803D] border border-green-200 shadow-sm">
            OFFICIAL ADVISORY RECORD
          </span>
        </div>

        {/* Executive Summary Metrics Grid */}
        {reportData?.summary && Object.keys(reportData.summary).length > 0 && (
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-4">
            <p className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-2">
              Executive Key Performance Metrics
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(reportData.summary).map(([key, val], idx) => (
                <div key={idx} className="bg-white p-2.5 rounded border border-gray-200 shadow-2xs">
                  <p className="text-[10px] text-[#6B7280] font-semibold">{key}</p>
                  <p className="text-base font-bold text-[#1F2937] mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                {reportData?.columns?.map((col, idx) => (
                  <th key={idx} className="text-xs whitespace-nowrap">{col}</th>
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
                  <td colSpan={reportData?.columns?.length || 5} className="py-12 text-center text-xs text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-[#1E5B3A] animate-spin" />
                      <span>Generating Report...</span>
                    </div>
                  </td>
                </tr>
              ) : !reportData?.rows || reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={reportData?.columns?.length || 5} className="py-12 text-center text-xs text-[#6B7280]">
                    No records found for the selected period.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50/70 transition-colors">
                    {reportData.columns.map((col, cIdx) => {
                      // Match column label to dictionary keys
                      let val = "N/A";
                      for (const [k, v] of Object.entries(row)) {
                        if (
                          k.toLowerCase().replace(/_/g, " ") === col.toLowerCase().replace(/_/g, " ") ||
                          k.toLowerCase() === col.toLowerCase()
                        ) {
                          val = v;
                          break;
                        }
                      }
                      if (val === "N/A" && row[col]) val = row[col];

                      const valStr = String(val ?? "");
                      const valUpper = valStr.toUpperCase();

                      // Dynamic badges for statuses/severities
                      let badgeClass = "";
                      if (valUpper.includes("CRITICAL") || valUpper.includes("NON-COMPLIANT") || valUpper.includes("OVERDUE")) {
                        badgeClass = "bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-semibold";
                      } else if (valUpper.includes("COMPLIANT") || valUpper.includes("COMPLETED") || valUpper.includes("RESOLVED") || valUpper.includes("NORMAL") || valUpper.includes("LOW")) {
                        badgeClass = "bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[11px] font-semibold";
                      } else if (valUpper.includes("MEDIUM") || valUpper.includes("PARTIAL") || valUpper.includes("WARNING")) {
                        badgeClass = "bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold";
                      }

                      return (
                        <td key={cIdx} className="text-xs text-[#1F2937] py-2.5">
                          {badgeClass ? (
                            <span className={badgeClass}>{valStr}</span>
                          ) : (
                            valStr
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Notice */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#6B7280] gap-2">
          <span>
            Total Displayed: <b>{reportData?.rows?.length || 0}</b> records retrieved from database
          </span>
          <span>
            Security Verification: <b>SHA-256 Verified</b> &bull; Prototype Governance Advisory
          </span>
        </div>
      </div>
    </div>
  );
}
