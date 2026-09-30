import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Activity, Mountain, ShieldCheck, ClipboardCheck,
  AlertTriangle, Flame, Bell, BarChart3, FileText, History,
  MapPin, Cpu, Shield, Settings, Users, X, Database, LifeBuoy,
  Radio, Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, onClose, onOpenSimulation }) {
  const { role } = useAuth();

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isGovOfficer = role === "GOVERNMENT_OFFICER" || isSuperAdmin;
  const isInspector = role === "INSPECTOR" || isGovOfficer;
  const isMineManager = role === "MINE_MANAGER" || isGovOfficer;

  // Pages required by AI-Powered Underground Mine Safety Monitoring and Rescue System
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, visible: true },
    { name: "Underground Mine Monitoring", path: "/mines", icon: Mountain, visible: true },
    { name: "Mine Zones", path: "/zones", icon: Layers, visible: true },
    { name: "Workers", path: "/workers", icon: Users, visible: true },
    { name: "Live Sensors", path: "/sensors", icon: Radio, visible: true },
    { name: "Hazard Detection", path: "/hazards", icon: AlertTriangle, visible: true },
    { name: "AI Risk Assessment", path: "/risk", icon: Activity, visible: true },
    { name: "Emergency Alerts", path: "/alerts", icon: Bell, visible: true },
    { name: "Incidents", path: "/incidents", icon: Flame, visible: true },
    { name: "Rescue Management", path: "/rescue", icon: LifeBuoy, visible: true },
    { name: "Safety Inspections", path: "/inspections", icon: ClipboardCheck, visible: isInspector || isMineManager },
    { name: "Safety Compliance", path: "/compliance", icon: ShieldCheck, visible: true },
    { name: "Reports", path: "/reports", icon: FileText, visible: true },
    { name: "Analytics", path: "/analytics", icon: BarChart3, visible: isGovOfficer },
    { name: "Data Sources", path: "/data-sources", icon: Database, visible: true },
    { name: "Audit Logs", path: "/audit-logs", icon: History, visible: isSuperAdmin || isGovOfficer },
    { name: "Users", path: "/users", icon: Users, visible: isSuperAdmin },
    { name: "Settings", path: "/settings", icon: Settings, visible: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 border-r border-gray-200 bg-white flex flex-col shrink-0 min-h-screen lg:min-h-[calc(100vh-4rem)] transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Section */}
        <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#1E5B3A] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#1F2937]">
                AI <span className="text-[#1E5B3A]">MineSafe</span>
              </span>
              <p className="text-[10px] text-[#6B7280]">Underground Safety & Rescue</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 text-[#6B7280] hover:text-[#1F2937] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            Safety & Rescue Modules
          </div>

          {navItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? "bg-[#1E5B3A]/10 text-[#1E5B3A] font-semibold border-r-3 border-[#1E5B3A]"
                      : "text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-50"
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 bg-[#F9FAFB] space-y-2">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
              onOpenSimulation();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-[#1E5B3A] bg-white hover:bg-gray-50 border border-gray-200 transition shadow-2xs"
          >
            <Cpu className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Rescue Simulation Studio</span>
          </button>

          <div className="px-3 pt-1 text-[11px] text-[#6B7280] text-center font-medium">
            AI MineSafe · DGMS Standard
          </div>
        </div>
      </aside>
    </>
  );
}

