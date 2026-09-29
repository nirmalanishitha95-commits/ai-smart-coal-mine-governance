import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MinesPage from "./pages/MinesPage";
import CompliancePage from "./pages/CompliancePage";
import InspectionsPage from "./pages/InspectionsPage";
import ViolationsPage from "./pages/ViolationsPage";
import CorrectiveActionsPage from "./pages/CorrectiveActionsPage";
import EnvironmentalPage from "./pages/EnvironmentalPage";
import AlertsPage from "./pages/AlertsPage";
import MapPage from "./pages/MapPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SimulationPage from "./pages/SimulationPage";
import MineDetailPage from "./pages/MineDetailPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Governance Platform Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/monitoring" element={<EnvironmentalPage />} />
            <Route path="/mines" element={<MinesPage />} />
            <Route path="/mines/:id" element={<MineDetailPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/violations" element={<ViolationsPage />} />
            <Route path="/corrective-actions" element={<CorrectiveActionsPage />} />
            <Route path="/environmental" element={<EnvironmentalPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
