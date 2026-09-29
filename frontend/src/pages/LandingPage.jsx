import React from "react";
import { Link } from "react-router-dom";
import {
  Shield, Cpu, AlertTriangle, Activity, CheckCircle, ArrowRight,
  Database, FileText, BarChart3, Lock, Users, Building, Layers,
  ShieldCheck
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col font-sans">
      {/* Top Government Strip */}
      <div className="bg-[#16462C] text-white text-[11px] py-1 px-6 text-center font-medium">
        Ministry of Coal · Directorate General of Mines Safety (DGMS) · Smart India Hackathon 2026
      </div>

      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#1E5B3A] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[#1F2937]">
              CoalGuard <span className="text-[#1E5B3A]">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 rounded">
              SIH 2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-semibold text-[#1F2937] hover:text-[#1E5B3A] px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
          >
            Portal Sign In
          </Link>
          <Link
            to="/dashboard"
            className="btn-primary text-xs !py-1.5 !px-3.5 shadow-xs"
          >
            Launch Command Board
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-6 border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 text-xs font-semibold text-[#1E5B3A]">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
            AI-Powered Statutory Governance for Coal Mining Operations
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-[#1F2937] tracking-tight leading-tight max-w-4xl mx-auto">
            AI-Based Smart Governance & Compliance Monitoring System for{" "}
            <span className="text-[#1E5B3A]">Coal Mines</span>
          </h1>

          <p className="text-sm sm:text-base text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            Bridging statutory safety compliance, multi-gas IoT sensor streams, and Isolation Forest machine learning to proactively prevent disasters and automate regulatory oversight.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="btn-primary text-sm !px-5 !py-2.5 shadow-xs"
            >
              <span>Access National Command Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="btn-secondary text-sm !px-5 !py-2.5"
            >
              <span>Demo Role Switcher Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="py-12 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gov-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#1E5B3A]/10 text-[#1E5B3A] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="card-title text-[#1F2937]">Real-Time IoT Telemetry</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Continuous multi-gas monitoring of underground Methane (CH4), Carbon Monoxide, and Respirable PM10 Dust with dynamic threshold alerting.
            </p>
          </div>

          <div className="gov-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#1E5B3A]/10 text-[#1E5B3A] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="card-title text-[#1F2937]">Machine Learning Anomaly Engine</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Scikit-Learn Isolation Forest surveillance classifying micro-deviations before gas concentrations breach critical statutory limits.
            </p>
          </div>

          <div className="gov-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#1E5B3A]/10 text-[#1E5B3A] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="card-title text-[#1F2937]">Closed-Loop Statutory Compliance</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Digital 7-question safety audit checklists, mandatory CAPA remediation SLAs, and immutable audit logs conforming to Coal Mines Regulations, 2017.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 border-t border-gray-200 bg-white text-center text-xs text-[#6B7280]">
        CoalGuard AI · Smart India Hackathon 2026 · Ministry of Coal & DGMS Digital Governance Platform
      </footer>
    </div>
  );
}
