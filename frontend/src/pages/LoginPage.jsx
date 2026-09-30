import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@coalguard.gov.in");
  const [password, setPassword] = useState("Admin@123");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const demoAccounts = [
    { role: "SUPER_ADMIN", label: "Super Admin", email: "admin@coalguard.gov.in", pass: "Admin@123", desc: "Mine Rescue Chief / Controller (All Mines, Zones, Operations)" },
    { role: "GOVERNMENT_OFFICER", label: "Govt Officer", email: "officer@coalguard.gov.in", pass: "Officer@123", desc: "DGMS Safety Officer (Hazards, Incidents, Verification)" },
    { role: "MINE_MANAGER", label: "Mine Manager", email: "manager@coalguard.gov.in", pass: "Manager@123", desc: "Colliery Safety Lead (Worker Safety, Telemetry, Rescue)" },
    { role: "INSPECTOR", label: "Statutory Inspector", email: "inspector@coalguard.gov.in", pass: "Inspector@123", desc: "Underground Safety Auditor (Atmospheric Audits, Checklists)" },
  ];

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === "INSPECTOR") {
        navigate("/inspections");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Invalid login credentials or server unreachable. Please verify."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#1E5B3A] text-white shadow-xs">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
          AI-Powered Underground Mine Safety Monitoring and Rescue System
        </h1>
        <p className="text-xs text-[#6B7280]">
          Real-time multi-gas sensor surveillance, hazard detection, worker safety, and emergency rescue operations
        </p>
        <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
          Smart India Hackathon 2026 · Official Safety Portal
        </span>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="gov-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Authorized Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@coalguard.gov.in"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#6B7280] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#1E5B3A] focus:ring-[#1E5B3A]"
                />
                <span>Remember session</span>
              </label>
              <Link to="/landing" className="text-[#1E5B3A] font-semibold hover:underline">
                Public Overview
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-xs shadow-xs"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Governance System"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher for Hackathon Evaluation */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                SIH Quick Role Auto-Fill
              </span>
              <span className="text-[10px] text-[#1E5B3A] font-semibold">1-Click Login</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`p-2 rounded border text-left transition ${
                    email === acc.email
                      ? "bg-[#1E5B3A]/10 border-[#1E5B3A]"
                      : "bg-[#F5F7FA] border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1F2937]">{acc.label}</span>
                    {email === acc.email && <Check className="w-3 h-3 text-[#1E5B3A]" />}
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 line-clamp-1">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-[#6B7280]">
          AI MineSafe · Directorate General of Mines Safety (DGMS) Compliant
        </div>
      </div>
    </div>
  );
}
