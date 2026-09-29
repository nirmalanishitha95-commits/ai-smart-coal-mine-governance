import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mountain, Search, Filter, Plus, ArrowUpDown, Eye, Edit2, Trash2,
  X, AlertTriangle, ShieldCheck, CheckCircle2, TrendingUp, Sparkles, RefreshCw
} from "lucide-react";
import { mineService } from "../services/api";
import RiskBadge from "../components/RiskBadge";
import { useAuth } from "../context/AuthContext";

export default function MinesPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [order, setOrder] = useState("desc");

  // Add Mine Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMineForm, setNewMineForm] = useState({
    name: "", code: "", location: "", district: "", state: "",
    mine_type: "Opencast", production_capacity: 2.5,
    operational_status: "Active", latitude: 23.75, longitude: 86.42
  });

  const fetchMines = () => {
    setLoading(true);
    mineService.getAll({
      search: search || undefined,
      risk_level: riskFilter || undefined,
      mine_type: typeFilter || undefined,
      sort_by: sortBy,
      order: order
    })
      .then((res) => setMines(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMines();
  }, [search, riskFilter, typeFilter, sortBy, order]);

  const handleCreateMine = async (e) => {
    e.preventDefault();
    try {
      await mineService.create(newMineForm);
      setShowAddModal(false);
      setNewMineForm({
        name: "", code: "", location: "", district: "", state: "",
        mine_type: "Opencast", production_capacity: 2.5,
        operational_status: "Active", latitude: 23.75, longitude: 86.42
      });
      fetchMines();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create mine.");
    }
  };

  const isOfficer = role === "SUPER_ADMIN" || role === "GOVERNMENT_OFFICER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              National Coal Mines Fleet Directory
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Registered coal producing assets, operational licenses, and statutory safety ratings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchMines} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          {isOfficer && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Mine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by mine name, code, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">Low Risk (0-30)</option>
              <option value="MEDIUM">Medium Risk (31-60)</option>
              <option value="HIGH">High Risk (61-80)</option>
              <option value="CRITICAL">Critical Risk (81-100)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="">All Mine Types</option>
              <option value="Opencast">Opencast</option>
              <option value="Underground">Underground</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#F5F7FA] hover:bg-gray-100 border border-gray-200 rounded-md text-xs text-[#1F2937] transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>{order === "asc" ? "Ascending" : "Descending"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mines Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Code & Name</th>
                <th>Location & District</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Compliance</th>
                <th>Risk Level</th>
                <th>Open Violations</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-xs text-[#6B7280]">
                    Loading coal mine assets registry...
                  </td>
                </tr>
              ) : mines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-xs text-[#6B7280]">
                    No mines matching your search criteria.
                  </td>
                </tr>
              ) : (
                mines.map((mine) => (
                  <tr
                    key={mine.id}
                    onClick={() => navigate(`/mines/${mine.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition"
                  >
                    <td>
                      <div className="font-bold text-xs text-[#1F2937] hover:text-[#1E5B3A]">
                        {mine.name}
                      </div>
                      <div className="font-mono text-[11px] text-[#6B7280]">
                        {mine.code}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-[#1F2937]">{mine.district}, {mine.state}</div>
                      <div className="text-[11px] text-[#6B7280]">{mine.location}</div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-[#4B5563]">
                        {mine.mine_type}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#1F2937]">
                      {mine.production_capacity} MTPA
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1F2937]">
                          {Math.round(mine.compliance_score || 85)}%
                        </span>
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (mine.compliance_score || 85) >= 80 ? "bg-[#15803D]" : "bg-[#D97706]"
                            }`}
                            style={{ width: `${Math.min(100, mine.compliance_score || 85)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <RiskBadge level={mine.risk_level} score={mine.risk_score} size="sm" />
                    </td>
                    <td>
                      <span className="font-bold text-xs text-[#DC2626]">
                        {mine.open_violations_count || 0} Open
                      </span>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/mines/${mine.id}`}
                        className="px-2.5 py-1 text-xs font-semibold text-[#1E5B3A] bg-[#1E5B3A]/10 hover:bg-[#1E5B3A]/20 rounded transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Mine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gov-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="card-title text-[#1F2937]">Register New Coal Mine Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMine} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Mine Name</label>
                <input
                  type="text"
                  required
                  value={newMineForm.name}
                  onChange={(e) => setNewMineForm({ ...newMineForm, name: e.target.value })}
                  placeholder="e.g. Dhanbad Deep Seam Sector 8"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Mine Code</label>
                  <input
                    type="text"
                    required
                    value={newMineForm.code}
                    onChange={(e) => setNewMineForm({ ...newMineForm, code: e.target.value })}
                    placeholder="e.g. CIL-DHN-011"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Mine Type</label>
                  <select
                    value={newMineForm.mine_type}
                    onChange={(e) => setNewMineForm({ ...newMineForm, mine_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  >
                    <option value="Opencast">Opencast</option>
                    <option value="Underground">Underground</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Location Address</label>
                <input
                  type="text"
                  required
                  value={newMineForm.location}
                  onChange={(e) => setNewMineForm({ ...newMineForm, location: e.target.value })}
                  placeholder="e.g. Near Katras Road, Coalfield Area"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newMineForm.district}
                    onChange={(e) => setNewMineForm({ ...newMineForm, district: e.target.value })}
                    placeholder="e.g. Dhanbad"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newMineForm.state}
                    onChange={(e) => setNewMineForm({ ...newMineForm, state: e.target.value })}
                    placeholder="e.g. Jharkhand"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Register Mine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
