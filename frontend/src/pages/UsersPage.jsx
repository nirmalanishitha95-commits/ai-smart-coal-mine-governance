import React, { useState } from "react";
import { Users, Search, ShieldCheck, Mail, Phone, Award, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const usersList = [
    {
      id: 1,
      name: "Dr. Rajeshwar Sharma",
      email: "admin@coalguard.gov.in",
      role: "SUPER_ADMIN",
      designation: "Chief Director General of Mines Safety",
      jurisdiction: "All India Coalfield Directorates",
      badgeNumber: "DGMS-HQ-001",
      phone: "+91 11 2338 4123",
      status: "ACTIVE",
      certifiedDate: "2021-04-15"
    },
    {
      id: 2,
      name: "Smt. Ananya Sengupta",
      email: "officer@coalguard.gov.in",
      role: "GOVERNMENT_OFFICER",
      designation: "Regional Safety Commissioner",
      jurisdiction: "Jharkhand & Eastern Coalfields Zone",
      badgeNumber: "DGMS-EAST-104",
      phone: "+91 65 1244 5890",
      status: "ACTIVE",
      certifiedDate: "2022-08-10"
    },
    {
      id: 3,
      name: "Er. Vikramaditya Reddy",
      email: "manager@coalguard.gov.in",
      role: "MINE_MANAGER",
      designation: "First Class Mine Manager (FCC)",
      jurisdiction: "Jharia Underground Sector 7",
      badgeNumber: "BCCL-MM-582",
      phone: "+91 32 6220 3341",
      status: "ACTIVE",
      certifiedDate: "2020-02-18"
    },
    {
      id: 4,
      name: "Inspector Pradeep Mahapatra",
      email: "inspector@coalguard.gov.in",
      role: "INSPECTOR",
      designation: "Senior Statutory Electrical & Ventilation Auditor",
      jurisdiction: "Korba & Talcher Coalfields",
      badgeNumber: "DGMS-INSP-219",
      phone: "+91 77 5240 1192",
      status: "ACTIVE",
      certifiedDate: "2023-01-12"
    },
    {
      id: 5,
      name: "Kavita Deshmukh",
      email: "kavita.deshmukh@wcl.gov.in",
      role: "INSPECTOR",
      designation: "Environmental & Dust Sampling Inspector",
      jurisdiction: "Nagpur & Wardha Valley",
      badgeNumber: "DGMS-W-088",
      phone: "+91 71 2256 7812",
      status: "ACTIVE",
      certifiedDate: "2024-03-20"
    },
    {
      id: 6,
      name: "Suresh Chandra Banik",
      email: "suresh.banik@ecl.gov.in",
      role: "MINE_MANAGER",
      designation: "Colliery Agent & Ventilation Manager",
      jurisdiction: "Raniganj Deep Seam Colliery",
      badgeNumber: "ECL-MGR-402",
      phone: "+91 34 1251 4409",
      status: "ACTIVE",
      certifiedDate: "2019-11-05"
    }
  ];

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E5B3A] text-white">Super Admin</span>;
      case "GOVERNMENT_OFFICER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E5B3A]/10 text-[#1E5B3A] border border-[#1E5B3A]/20">Govt Officer</span>;
      case "MINE_MANAGER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-[#D97706] border border-amber-200">Mine Manager</span>;
      case "INSPECTOR":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2563EB] border border-blue-200">Statutory Inspector</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#6B7280]">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gov-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1E5B3A]" />
            <h1 className="page-title text-xl sm:text-2xl font-bold text-[#1F2937]">
              Statutory Officers & Mining Personnel Directory
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Role-Based Access Control (RBAC), DGMS auditor certifications, and regional jurisdiction assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-[#15803D] border border-green-200 rounded-md flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{filteredUsers.length} Certified Officials</span>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search officer name, badge, jurisdiction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#1E5B3A]"
            >
              <option value="ALL">All Statutory Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="GOVERNMENT_OFFICER">Government Officer</option>
              <option value="MINE_MANAGER">Mine Manager</option>
              <option value="INSPECTOR">Inspector</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left gov-table">
            <thead>
              <tr>
                <th>Officer / Personnel</th>
                <th>Role & Authorization</th>
                <th>Assigned Jurisdiction</th>
                <th>Badge & Certificate</th>
                <th>Contact Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold text-xs text-[#1F2937]">{u.name}</div>
                    <div className="text-[11px] text-[#6B7280]">{u.designation}</div>
                  </td>
                  <td>
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="text-xs text-[#1F2937]">
                    {u.jurisdiction}
                  </td>
                  <td>
                    <span className="font-mono text-xs font-semibold text-[#1E5B3A]">{u.badgeNumber}</span>
                    <div className="text-[11px] text-[#6B7280]">Cert: {u.certifiedDate}</div>
                  </td>
                  <td>
                    <div className="text-xs text-[#1F2937] flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#6B7280]" />
                      <span>{u.email}</span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#6B7280]" />
                      <span>{u.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#15803D]">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
