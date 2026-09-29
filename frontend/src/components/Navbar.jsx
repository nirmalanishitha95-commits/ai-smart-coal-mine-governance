import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, Shield, Cpu, User, LogOut, ChevronDown, Sparkles, ExternalLink,
  Activity, CheckCircle2, AlertCircle, Menu, Bot
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { alertService } from "../services/api";
import { realtimeService } from "../services/realtime";

export default function Navbar({ onOpenSimulation, onOpenCopilot, onToggleSidebar }) {
  const { user, role, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [realtimeState, setRealtimeState] = useState(realtimeService.getState());
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    // Unread count
    const fetchUnread = () => {
      alertService.getUnreadCount()
        .then((res) => setUnreadCount(res.data.unread_count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    // Subscribe to realtime stream
    const unsubscribe = realtimeService.subscribe((state) => {
      setRealtimeState(state);
      setSecondsAgo(0);
    });

    // Seconds-ago ticker
    const ticker = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(ticker);
      unsubscribe();
    };
  }, []);

  const handleRoleSwitch = async (targetRole) => {
    setShowRoleDropdown(false);
    await switchDemoRole(targetRole);
    if (targetRole === "SUPER_ADMIN" || targetRole === "GOVERNMENT_OFFICER" || targetRole === "MINE_MANAGER") {
      navigate("/dashboard");
    } else if (targetRole === "INSPECTOR") {
      navigate("/inspections");
    }
  };

  const isOnline = realtimeState.status === "LIVE" || realtimeState.status === "FALLBACK_POLLING";

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-gray-200 bg-white px-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 rounded-md transition"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-[#1E5B3A] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#1F2937]">
                CoalGuard <span className="text-[#1E5B3A]">AI</span>
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
                Gov Dashboard
              </span>
            </div>
            <p className="hidden lg:block text-[11px] text-[#6B7280] -mt-0.5">
              AI-Based Smart Governance & Compliance Monitoring
            </p>
          </div>
        </Link>
      </div>

      {/* Center: Real-Time System Status Indicator */}
      <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#F5F7FA] border border-gray-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-[#15803D] animate-pulse" : "bg-[#DC2626]"
            }`}
          />
          <span className="font-medium text-[#1F2937]">
            {isOnline ? "Live Data Connected" : "Connection Lost"}
          </span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-[11px] text-[#6B7280]">
          {isOnline
            ? `Updated ${secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}`
            : "Reconnecting..."}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Groq AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#1E5B3A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition shadow-xs active:scale-95 cursor-pointer"
          title="Ask CoalGuard Groq AI Copilot"
        >
          <Bot className="w-3.5 h-3.5 text-[#1E5B3A]" />
          <span className="hidden sm:inline">AI Copilot</span>
          <span className="px-1 py-0.2 text-[9px] font-bold bg-[#1E5B3A] text-white rounded">Groq</span>
        </button>

        {/* Run AI Risk Simulation Button */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#1E5B3A] hover:bg-[#16462C] transition shadow-xs active:scale-95 cursor-pointer"
          title="Run 14-step AI closed-loop governance simulation"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Run AI Simulation</span>
          <span className="sm:hidden">Simulate</span>
        </button>

        {/* Alerts Bell */}
        <Link
          to="/alerts"
          className="relative p-2 text-[#6B7280] hover:text-[#1F2937] rounded-md hover:bg-gray-100 transition"
          title="Alerts Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowUserDropdown(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F5F7FA] hover:bg-gray-100 border border-gray-200 text-xs text-[#1F2937] transition"
            title="Switch demo role for evaluation"
          >
            <span className="hidden lg:inline text-[11px] text-[#6B7280]">Role:</span>
            <span className="font-semibold text-[#1E5B3A] max-w-[110px] truncate">
              {role?.replace("_", " ")}
            </span>
            <ChevronDown className="w-3 h-3 text-[#6B7280]" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-gray-200 shadow-lg py-1 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                Quick Role Switcher (SIH)
              </div>
              {[
                { role: "SUPER_ADMIN", label: "Super Admin", sub: "admin@coalguard.gov.in" },
                { role: "GOVERNMENT_OFFICER", label: "Govt Officer", sub: "officer@coalguard.gov.in" },
                { role: "MINE_MANAGER", label: "Mine Manager", sub: "manager@coalguard.gov.in" },
                { role: "INSPECTOR", label: "Statutory Inspector", sub: "inspector@coalguard.gov.in" },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleRoleSwitch(item.role)}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-gray-50 transition ${
                    role === item.role ? "bg-[#1E5B3A]/10 text-[#1E5B3A] font-semibold" : "text-[#1F2937]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-[#6B7280]">{item.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile & Logout Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowRoleDropdown(false);
            }}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 transition text-[#1F2937]"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[#1E5B3A] font-semibold text-xs">
              <User className="w-4 h-4" />
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-60 rounded-lg bg-white border border-gray-200 shadow-lg py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-[#1F2937] truncate">{user?.name || "Statutory Officer"}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1E5B3A]/10 text-[#1E5B3A]">
                  {role?.replace("_", " ")}
                </span>
              </div>
              <div className="py-1">
                <Link
                  to="/landing"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-[#1F2937] hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
                  Public Portal
                </Link>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#DC2626] hover:bg-red-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
