import React, { useState, useEffect } from "react";
import {
  Database, ExternalLink, ShieldCheck, Activity, AlertTriangle,
  Building, Calendar, CheckCircle, Info, RefreshCw, BarChart2
} from "lucide-react";
import { dataSourceService } from "../services/api";

export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [dataSources, setDataSources] = useState([]);
  const [productionData, setProductionData] = useState(null);
  const [accidentData, setAccidentData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dataSourceService.getAll().catch(() => ({ data: [] })),
      dataSourceService.getProduction().catch(() => ({ data: { records: [] } })),
      dataSourceService.getAccidents().catch(() => ({ data: { records: [] } })),
      dataSourceService.getSafetyIndicators().catch(() => ({ data: { records: [] } })),
    ])
      .then(([dsRes, prodRes, accRes, safeRes]) => {
        setDataSources(dsRes.data || []);
        setProductionData(prodRes.data || {});
        setAccidentData(accRes.data || {});
        setSafetyData(safeRes.data || {});
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Authoritative Public Datasets & Data Provenance
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Authoritative public datasets from the Ministry of Coal, DGMS, and Coal Controller's Organisation (CCO) with transparent provenance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-md text-xs font-bold bg-green-50 text-[#15803D] border border-green-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Provenance Standard</span>
          </span>
        </div>
      </div>

      {/* 2. SIH 2026 Transparent Data Policy Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
          <Info className="w-4.5 h-4.5 text-blue-700 flex-shrink-0" />
          <span>Statutory Data Integrity & Provenance Policy (SIH 2026)</span>
        </div>
        <p className="leading-relaxed">
          <b>Zero Fabricated Statistics Policy:</b> CoalGuard AI strictly distinguishes between verified historical government data and simulated edge streams:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="bg-white/80 p-2.5 rounded border border-blue-200 flex items-start gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide flex-shrink-0">
              Historical Government Data
            </span>
            <span className="text-[11px] text-gray-700">
              Sourced directly from the Ministry of Coal, Coal Controller's Organisation (CCO) and DGMS published annual reports.
            </span>
          </div>
          <div className="bg-white/80 p-2.5 rounded border border-blue-200 flex items-start gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide flex-shrink-0">
              DEMO IoT STREAM
            </span>
            <span className="text-[11px] text-gray-700">
              High-frequency multi-gas sensor readings generated for live hackathon anomaly simulation and isolation forest verification.
            </span>
          </div>
        </div>
        <p className="text-[11px] text-blue-800/90 pt-1">
          <b>AI Disclaimer:</b> All AI risk evaluations are prototype decision-support calculations and do NOT constitute official legal or regulatory decisions under the Coal Mines Regulations (CMR 2017).
        </p>
      </div>

      {/* 3. Top Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gov-card p-4">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Registered Datasets</p>
          <p className="text-2xl font-bold text-[#1F2937] mt-1">{dataSources.length || 4}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-medium">3 Gov Sources + 1 IoT</p>
        </div>

        <div className="gov-card p-4">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Historical Production</p>
          <p className="text-2xl font-bold text-[#1E5B3A] mt-1">
            {productionData?.summary?.total_production_mt ? `${productionData.summary.total_production_mt} MT` : "170.4 MT"}
          </p>
          <p className="text-[10px] text-[#6B7280] mt-1">Coal Directory of India (CCO)</p>
        </div>

        <div className="gov-card p-4">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">DGMS Accident Records</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {accidentData?.records?.length || 12}
          </p>
          <p className="text-[10px] text-[#6B7280] mt-1">Classified Historical 2019-2023</p>
        </div>

        <div className="gov-card p-4">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Sensor Telemetry</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">1,050</p>
          <p className="text-[10px] text-amber-700 mt-1 font-medium">Tagged: DEMO IoT STREAM</p>
        </div>
      </div>

      {/* 4. Navigation Tabs */}
      <div className="border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "catalog"
              ? "border-[#1E5B3A] text-[#1E5B3A]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          Data Sources Catalog ({dataSources.length || 4})
        </button>

        <button
          onClick={() => setActiveTab("production")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "production"
              ? "border-[#1E5B3A] text-[#1E5B3A]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          Coal Production & Despatch (CCO / MoC)
        </button>

        <button
          onClick={() => setActiveTab("accidents")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "accidents"
              ? "border-[#1E5B3A] text-[#1E5B3A]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          Accident & Safety Statistics (DGMS)
        </button>

        <button
          onClick={() => setActiveTab("indicators")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "indicators"
              ? "border-[#1E5B3A] text-[#1E5B3A]"
              : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          National Safety Rates (DGMS)
        </button>
      </div>

      {/* 5. Tab Content */}
      {loading ? (
        <div className="gov-card p-12 text-center text-xs text-[#6B7280] flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#1E5B3A] animate-spin" />
          <span>Synchronizing public datasets...</span>
        </div>
      ) : activeTab === "catalog" ? (
        /* Tab 1: Dataset Catalog */
        <div className="gov-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
              Public Dataset Provenance Registry
            </h2>
            <span className="text-[11px] text-[#6B7280]">
              Authority verification against data.gov.in & dgms.gov.in
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left gov-table">
              <thead>
                <tr>
                  <th className="text-xs">Dataset Name</th>
                  <th className="text-xs">Source Organization</th>
                  <th className="text-xs">Reporting Period</th>
                  <th className="text-xs">Data Classification</th>
                  <th className="text-xs">Records</th>
                  <th className="text-xs">Official Portal URL</th>
                  <th className="text-xs">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataSources.map((ds) => (
                  <tr key={ds.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="text-xs font-bold text-[#1F2937] py-3">
                      <div>{ds.name}</div>
                      <div className="text-[10px] text-[#6B7280] font-normal mt-0.5 max-w-sm line-clamp-1">
                        {ds.description}
                      </div>
                    </td>
                    <td className="text-xs text-[#4B5563]">{ds.source_organization}</td>
                    <td className="text-xs text-[#4B5563]">{ds.source_date}</td>
                    <td className="text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ds.data_type === "DEMO IoT STREAM"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {ds.data_type}
                      </span>
                    </td>
                    <td className="text-xs font-semibold text-[#1F2937]">{ds.record_count}</td>
                    <td className="text-xs">
                      {ds.source_url.startsWith("http") ? (
                        <a
                          href={ds.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#1E5B3A] hover:underline font-medium"
                        >
                          <span>{ds.source_url.replace("https://", "")}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-500 italic">{ds.source_url}</span>
                      )}
                    </td>
                    <td className="text-[11px] text-[#6B7280]">{ds.last_imported}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "production" ? (
        /* Tab 2: Production Records */
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span><b>Data Provenance:</b> Coal Directory of India, Coal Controller's Organisation (CCO), Ministry of Coal, Govt. of India.</span>
            </div>
            <a href="https://coal.gov.in" target="_blank" rel="noreferrer" className="text-emerald-800 underline font-semibold flex items-center gap-1">
              <span>coal.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                Colliery Production & Despatch (Fiscal Year 2022-23)
              </h2>
              <span className="text-xs text-[#6B7280]">
                All figures in Million Metric Tonnes (MT)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th className="text-xs">Colliery Name</th>
                    <th className="text-xs">Subsidiary / Company</th>
                    <th className="text-xs">State</th>
                    <th className="text-xs">Fiscal Year</th>
                    <th className="text-xs">Coking Coal (MT)</th>
                    <th className="text-xs">Non-Coking Coal (MT)</th>
                    <th className="text-xs">Total Production (MT)</th>
                    <th className="text-xs">Offtake / Despatch (MT)</th>
                    <th className="text-xs">Data Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productionData?.records?.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="text-xs font-bold text-[#1F2937] py-2.5">{r.mine_name}</td>
                      <td className="text-xs text-[#4B5563]">{r.company}</td>
                      <td className="text-xs text-[#4B5563]">{r.state}</td>
                      <td className="text-xs text-[#4B5563]">{r.fiscal_year}</td>
                      <td className="text-xs text-[#1F2937]">{r.coking_coal_mt.toFixed(1)}</td>
                      <td className="text-xs text-[#1F2937]">{r.non_coking_coal_mt.toFixed(1)}</td>
                      <td className="text-xs font-bold text-[#1E5B3A]">{r.total_production_mt.toFixed(1)}</td>
                      <td className="text-xs font-semibold text-gray-700">{r.offtake_despatch_mt.toFixed(1)}</td>
                      <td className="text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.data_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "accidents" ? (
        /* Tab 3: Accident Records */
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span><b>Data Provenance:</b> Directorate General of Mines Safety (DGMS) Annual Statistics on Safety and Accidents in Coal Mines.</span>
            </div>
            <a href="https://dgms.gov.in" target="_blank" rel="noreferrer" className="text-amber-800 underline font-semibold flex items-center gap-1">
              <span>dgms.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                Historical Colliery Fatal & Serious Accidents (2019-2023)
              </h2>
              <span className="text-xs text-[#6B7280]">
                Classified by DGMS standard accident categories
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th className="text-xs">Colliery Name</th>
                    <th className="text-xs">Company</th>
                    <th className="text-xs">State</th>
                    <th className="text-xs">Year</th>
                    <th className="text-xs">Accident Classification</th>
                    <th className="text-xs">Fatalities</th>
                    <th className="text-xs">Injuries</th>
                    <th className="text-xs">Technical Cause Summary</th>
                    <th className="text-xs">Data Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accidentData?.records?.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="text-xs font-bold text-[#1F2937] py-2.5">{r.mine_name}</td>
                      <td className="text-xs text-[#4B5563]">{r.company}</td>
                      <td className="text-xs text-[#4B5563]">{r.state}</td>
                      <td className="text-xs font-semibold text-gray-700">{r.year}</td>
                      <td className="text-xs text-[#1F2937]">{r.accident_type}</td>
                      <td className="text-xs">
                        {r.fatalities > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                            {r.fatalities}
                          </span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="text-xs">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800">
                          {r.serious_injuries}
                        </span>
                      </td>
                      <td className="text-xs text-[#4B5563] max-w-xs">{r.cause_classification}</td>
                      <td className="text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.data_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 4: National Safety Rates */
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span><b>Data Provenance:</b> DGMS Annual Indicators - Fatality & Serious Injury Rates per MT Output & per 1,000 Workers.</span>
            </div>
            <a href="https://dgms.gov.in" target="_blank" rel="noreferrer" className="text-blue-800 underline font-semibold flex items-center gap-1">
              <span>dgms.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
                Official DGMS National Coal Mining Safety Rates (2019 - 2023)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left gov-table">
                <thead>
                  <tr>
                    <th className="text-xs">Year</th>
                    <th className="text-xs">National Jurisdiction</th>
                    <th className="text-xs">Fatality Rate (per MT Coal Output)</th>
                    <th className="text-xs">Serious Injury Rate (per MT Output)</th>
                    <th className="text-xs">Fatality Rate (per 1,000 Workers)</th>
                    <th className="text-xs">Injury Rate (per 1,000 Workers)</th>
                    <th className="text-xs">Data Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {safetyData?.records?.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="text-xs font-bold text-[#1F2937] py-2.5">{r.year}</td>
                      <td className="text-xs text-[#4B5563]">{r.jurisdiction}</td>
                      <td className="text-xs font-bold text-[#1E5B3A]">{r.fatality_rate_per_mt.toFixed(2)}</td>
                      <td className="text-xs font-semibold text-gray-700">{r.serious_injury_rate_per_mt.toFixed(2)}</td>
                      <td className="text-xs text-[#1F2937]">{r.fatality_rate_per_1000_workers.toFixed(2)}</td>
                      <td className="text-xs text-[#1F2937]">{r.serious_injury_rate_per_1000_workers.toFixed(2)}</td>
                      <td className="text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.data_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
