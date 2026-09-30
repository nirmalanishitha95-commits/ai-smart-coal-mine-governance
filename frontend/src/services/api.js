import axios from "axios";

// Render Production API URL Configuration
// Resolves from VITE_API_URL environment variable configured on Render
// Fallback directly to deployed Render backend: https://ai-smart-coal-mine-governance.onrender.com
const DEFAULT_PROD_API = "https://ai-smart-coal-mine-governance.onrender.com";
const envApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const rawApiUrl = envApiUrl || (import.meta.env.PROD ? DEFAULT_PROD_API : "");

export const API_URL = rawApiUrl 
  ? (rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`)
  : "/api";
export const API_BASE_URL = API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("coalguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Production-safe response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if already on login page
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("coalguard_token");
        localStorage.removeItem("coalguard_user");
      }
    }

    // Clean user-facing error message (never expose raw database credentials or stack traces)
    let userMessage = "Unable to connect to AI MineSafe server. Please try again.";
    if (!error.response) {
      userMessage = "Unable to connect to AI MineSafe server. Please verify your connection or try again.";
    } else if (error.response.status >= 500) {
      userMessage = "AI MineSafe server is currently processing. Please try again in a few moments.";
    } else if (error.response.data?.detail) {
      const detail = error.response.data.detail;
      userMessage = typeof detail === "string" ? detail : (detail[0]?.msg || JSON.stringify(detail));
    }
    error.userMessage = userMessage;

    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
};

export const dashboardService = {
  getStats: () => api.get("/dashboard"),
};

export const mineService = {
  getAll: (params) => api.get("/mines", { params }),
  getById: (id) => api.get(`/mines/${id}`),
  create: (data) => api.post("/mines", data),
  update: (id, data) => api.put(`/mines/${id}`, data),
  delete: (id) => api.delete(`/mines/${id}`),
  getRisk: (id) => api.get(`/mines/${id}/risk`),
};

export const complianceService = {
  getRecords: (params) => api.get("/compliance", { params }),
  getRules: () => api.get("/compliance/rules"),
  updateRecord: (id, data) => api.put(`/compliance/${id}`, data),
};

export const inspectionService = {
  getAll: (params) => api.get("/inspections", { params }),
  getById: (id) => api.get(`/inspections/${id}`),
  schedule: (data) => api.post("/inspections", data),
  submitChecklist: (id, data) => api.post(`/inspections/${id}/checklist`, data),
};

export const violationService = {
  getAll: (params) => api.get("/violations", { params }),
  getById: (id) => api.get(`/violations/${id}`),
  create: (data) => api.post("/violations", data),
  update: (id, data) => api.put(`/violations/${id}`, data),
};

export const correctiveActionService = {
  getAll: (params) => api.get("/corrective-actions", { params }),
  create: (data) => api.post("/corrective-actions", data),
  update: (id, data) => api.put(`/corrective-actions/${id}`, data),
};

export const sensorService = {
  getReadings: (params) => api.get("/sensors/readings", { params }),
  ingest: (data) => api.post("/sensors/readings", data),
  getLiveTable: () => api.get("/sensors/live-table"),
  getEnvironmentalSummary: (params) => api.get("/sensors/environmental/summary", { params }),
};

export const alertService = {
  getAll: (params) => api.get("/alerts", { params }),
  getUnreadCount: () => api.get("/alerts/unread-count"),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
};

export const analyticsService = {
  getAnalytics: (params) => api.get("/analytics", { params }),
};

export const reportService = {
  getStats: () => api.get("/reports/stats"),
  getSummary: (params) => api.get("/reports/summary", { params }),
  getCompliance: (params) => api.get("/reports/compliance", { params }),
  getInspections: (params) => api.get("/reports/inspections", { params }),
  getViolations: (params) => api.get("/reports/violations", { params }),
  getCorrectiveActions: (params) => api.get("/reports/corrective-actions", { params }),
  getEnvironmental: (params) => api.get("/reports/environmental", { params }),
  getRisk: (params) => api.get("/reports/risk", { params }),
  downloadPdf: async (params) => {
    const res = await api.get("/reports/pdf", { params, responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = res.headers["content-disposition"] || "";
    let filename = `minesafe_${params.report_type || "report"}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },
  downloadCsv: async (params) => {
    const res = await api.get("/reports/csv", { params, responseType: "blob" });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = res.headers["content-disposition"] || "";
    let filename = `minesafe_${params.report_type || "report"}_${new Date().toISOString().slice(0, 10)}.csv`;
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },
  getExportCsvUrl: (reportType = "compliance", mineId = null, status = null, startDate = null, endDate = null) => {
    let url = `${API_URL}/reports/export-csv?report_type=${reportType}`;
    if (mineId) url += `&mine_id=${mineId}`;
    if (status) url += `&status=${status}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return url;
  },
  getExportPdfUrl: (reportType = "compliance", mineId = null, status = null, startDate = null, endDate = null) => {
    let url = `${API_URL}/reports/pdf?report_type=${reportType}`;
    if (mineId) url += `&mine_id=${mineId}`;
    if (status) url += `&status=${status}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return url;
  },
};

export const auditService = {
  getAll: (params) => api.get("/audit-logs", { params }),
};

export const simulationService = {
  run: (mineId) => api.post("/simulation/run", { mine_id: mineId }),
  reset: (mineId) => api.post(`/simulation/reset?mine_id=${mineId || 1}`),
};

export const aiService = {
  getStatus: () => api.get("/ai/status"),
  askCopilot: (query, conversationHistory = [], mineId = null) =>
    api.post("/ai/copilot", {
      query,
      conversation_history: conversationHistory,
      mine_id: mineId,
    }),
  getMineAnalysis: (mineId) => api.post(`/ai/mine-analysis/${mineId}`),
};

export const dataSourceService = {
  getAll: () => api.get("/data-sources"),
  getProduction: (params) => api.get("/data-sources/production", { params }),
  getAccidents: (params) => api.get("/data-sources/accidents", { params }),
  getSafetyIndicators: () => api.get("/data-sources/safety-indicators"),
};

export const rescueService = {
  getOperations: (params) => api.get("/rescue/operations", { params }),
  updateOperationStatus: (id, status, notes) =>
    api.put(`/rescue/operations/${id}/status?status=${encodeURIComponent(status)}&notes=${encodeURIComponent(notes || "")}`),
  getTeams: (params) => api.get("/rescue/teams", { params }),
};

export const workerService = {
  getAll: (params) => api.get("/workers", { params }),
  getInDanger: (mineId) => api.get("/workers/in-danger", { params: { mine_id: mineId } }),
  getSummary: (mineId) => api.get("/workers/summary", { params: { mine_id: mineId } }),
  updateStatus: (id, status, zone) => api.put(`/workers/${id}/status`, { status, assigned_zone: zone }),
  startRescue: (id, payload) => api.post(`/workers/${id}/rescue`, payload || {}),
};

export const zoneService = {
  getAll: (params) => api.get("/zones", { params }),
};

export const hazardService = {
  getAll: (params) => api.get("/hazards", { params }),
  resolve: (id, actionsTaken) => api.put(`/hazards/${id}/resolve`, { actions_taken: actionsTaken }),
};

export default api;

