import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  ExternalLink,
  Box,
  Building,
  Mail,
  Grid,
  List as ListIcon,
  FileDown
} from 'lucide-react';
import { Employee, FFEAsset } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';
import { exportEmployeesToPdf, exportEmployeeCustodySlipToPdf } from '../../lib/pdfExport';

interface EmployeeListProps {
  employees: Employee[];
  assets: FFEAsset[];
  onOpenAddModal: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  onShowQRModal: (emp: Employee) => void;
  onViewEmployeeProfile: (empId: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  assets,
  onOpenAddModal,
  onEditEmployee,
  onDeleteEmployee,
  onShowQRModal,
  onViewEmployeeProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'grid'>('grid');

  // List of unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        emp.fullName.toLowerCase().includes(searchLower) ||
        emp.id.toLowerCase().includes(searchLower) ||
        emp.department.toLowerCase().includes(searchLower) ||
        emp.title.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower);

      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Staff & Employee Directory</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              {filteredEmployees.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered personnel with assigned FFE tracking badges and scannable QR codes
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportEmployeesToPdf(filteredEmployees, assets)}
            className="px-4 py-2.5 bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/80 text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
            title="Export professional Staff Directory PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Export Staff PDF</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Employee Name, ID, Department, Job Title, or Email..."
              className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter Selector */}
          <div className="flex items-center gap-3">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white/60 border border-white/80 rounded-2xl py-2 px-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-white/60 p-1 rounded-2xl border border-white/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Display */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-12 text-center text-slate-500 shadow-sm">
          <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No employees match your search criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search keywords</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const assignedCount = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id).length;
            const photoSrc = formatGoogleDriveUrl(emp.photoUrl) || getFallbackAvatarUrl(emp.fullName);

            return (
              <div
                key={emp.id}
                className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-sm hover:bg-white/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={photoSrc}
                        alt={emp.fullName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackAvatarUrl(emp.fullName);
                        }}
                        className="w-14 h-14 rounded-full object-cover bg-white border-2 border-white/80 shadow-md shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                            {emp.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight mt-1 group-hover:text-indigo-600 transition-colors">
                          {emp.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{emp.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-white/30">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{emp.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white/50 rounded-2xl border border-white/80 flex items-center justify-between shadow-sm">
                    <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                      <Box className="w-4 h-4 text-indigo-600" />
                      <span>Assigned Assets:</span>
                    </span>
                    <span className="font-bold text-xs text-indigo-700 px-2.5 py-0.5 bg-indigo-100 rounded-full">
                      {assignedCount} Items
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-white/30 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onViewEmployeeProfile(emp.id)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      const empAssigned = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id);
                      exportEmployeeCustodySlipToPdf(emp, empAssigned);
                    }}
                    className="p-2 bg-white/60 hover:bg-white/90 text-slate-700 hover:text-indigo-600 border border-white/80 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    title="Export Custody Slip (PDF)"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onShowQRModal(emp)}
                    className="p-2 bg-white/60 hover:bg-white/90 text-indigo-700 border border-white/80 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    title="View QR Code Badge"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEditEmployee(emp)}
                    className="p-2 bg-white/60 hover:bg-white/90 text-slate-700 border border-white/80 rounded-xl transition-colors flex justify-center shadow-sm"
                    title="Edit Employee"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteEmployee(emp)}
                    className="p-2 bg-white/60 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-white/80 rounded-xl transition-colors flex justify-center shadow-sm"
                    title="Delete Employee"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/40 text-slate-500 text-[10px] uppercase font-bold sticky top-0 backdrop-blur-md border-b border-white/20">
                <tr>
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Department & Title</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Assigned Assets</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filteredEmployees.map((emp) => {
                  const assignedCount = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id).length;
                  const photoSrc = formatGoogleDriveUrl(emp.photoUrl) || getFallbackAvatarUrl(emp.fullName);

                  return (
                    <tr key={emp.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={photoSrc}
                            alt={emp.fullName}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackAvatarUrl(emp.fullName);
                            }}
                            className="w-10 h-10 rounded-full object-cover bg-white border border-white/80 shrink-0 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{emp.fullName}</p>
                            <p className="text-[11px] font-mono font-bold text-indigo-600">{emp.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{emp.department}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{emp.title}</p>
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-medium">{emp.email}</td>

                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full">
                          {assignedCount} Items
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewEmployeeProfile(emp.id)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 transition-all shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              const empAssigned = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id);
                              exportEmployeeCustodySlipToPdf(emp, empAssigned);
                            }}
                            className="p-2 bg-white/60 hover:bg-white/90 text-slate-700 hover:text-indigo-600 border border-white/80 rounded-xl transition-colors shadow-sm"
                            title="Export Custody Slip (PDF)"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onShowQRModal(emp)}
                            className="p-2 bg-white/60 hover:bg-white/90 text-indigo-700 border border-white/80 rounded-xl transition-colors shadow-sm"
                            title="QR Code Badge"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditEmployee(emp)}
                            className="p-2 bg-white/60 hover:bg-white/90 text-slate-700 border border-white/80 rounded-xl transition-colors shadow-sm"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteEmployee(emp)}
                            className="p-2 bg-white/60 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-white/80 rounded-xl transition-colors shadow-sm"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
