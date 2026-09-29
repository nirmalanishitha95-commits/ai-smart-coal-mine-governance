import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SimulationModal from "../components/SimulationModal";
import AICopilotModal from "../components/AICopilotModal";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#1E5B3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading CoalGuard AI Central Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSimulationComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#1F2937]">
      <Navbar
        onOpenSimulation={() => setIsSimOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSimulation={() => setIsSimOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F5F7FA]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet
              context={{
                refreshTrigger,
                onOpenSimulation: () => setIsSimOpen(true),
                onOpenCopilot: () => setIsCopilotOpen(true),
              }}
            />
          </div>
        </main>
      </div>

      <SimulationModal
        isOpen={isSimOpen}
        onClose={() => setIsSimOpen(false)}
        onComplete={handleSimulationComplete}
      />

      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
}
