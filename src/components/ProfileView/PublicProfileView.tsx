import React, { useState } from 'react';
import { Employee, FFEAsset } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';
import { Box, ShieldCheck, QrCode, LogIn, Search, CheckCircle2, Building, Mail, User } from 'lucide-react';

interface PublicProfileViewProps {
  employee: Employee;
  assignedAssets: FFEAsset[];
  employees: Employee[];
  onSelectEmployee: (empId: string) => void;
  onGoToLogin: () => void;
  onOpenScanner: () => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  employee,
  assignedAssets,
  employees,
  onSelectEmployee,
  onGoToLogin,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const photoSrc = formatGoogleDriveUrl(employee.photoUrl) || getFallbackAvatarUrl(employee.fullName);

  // ROBUST FIX: Case-insensitive and whitespace-safe filter for assigned assets
  const verifiedAssignedAssets = assignedAssets.filter((a) => {
    if (!a.assignedToEmployeeId) return false;
    const matchesEmp = a.assignedToEmployeeId.trim().toLowerCase() === employee.id.trim().toLowerCase();
    const isAssignedStatus = 
      !a.status || 
      a.status.toLowerCase() === 'assigned' || 
      a.status.toLowerCase() === 'active' || 
      a.status.toLowerCase() === 'deployed';
    return matchesEmp && isAssignedStatus;
  });

  const filteredAssets = verifiedAssignedAssets.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white">FFE Workplace Audit Portal</h1>
            <p className="text-[10px] text-slate-400 font-medium">Verified Public Custody Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Scan Another</span>
          </button>
          <button
            onClick={onGoToLogin}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Employee Profile Header Card */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={photoSrc}
            alt={employee.fullName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getFallbackAvatarUrl(employee.fullName);
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-slate-700 border-2 border-indigo-500/50 shadow-lg shrink-0"
          />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                {employee.id}
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified Custody Profile
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {employee.fullName}
            </h2>

            <div className="text-xs text-slate-300 font-medium space-y-0.5">
              <p className="text-indigo-200 font-semibold">{employee.title || 'Staff'}</p>
              <p className="flex items-center justify-center sm:justify-start gap-1 text-slate-400">
                <Building className="w-3.5 h-3.5 text-slate-500" /> {employee.department || 'General Department'}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Assets Section */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Assigned FFE Assets</h3>
                <p className="text-xs text-slate-400">
                  Total Active Items: <strong className="text-emerald-400">{verifiedAssignedAssets.length}</strong>
                </p>
              </div>
            </div>

            {/* Quick Filter Search */}
            {verifiedAssignedAssets.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter assigned items..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Asset List Grid or Empty State */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
              <Box className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No FFE assets currently assigned to this profile</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                If items were recently added, verify that they are linked correctly in the admin console.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-slate-900/70 border border-slate-700/70 rounded-2xl p-4 shadow-md space-y-3 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-950 border border-indigo-900 px-2 py-0.5 rounded-md">
                        {asset.id}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1.5">{asset.name}</h4>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {asset.status || 'Assigned'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Category</span>
                      <span className="font-medium text-slate-200">{asset.category || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Location</span>
                      <span className="font-medium text-slate-200">{asset.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Employee Switcher (If multiple employees exist) */}
        {employees.length > 1 && (
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Switch Profile View</h4>
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    emp.id.toLowerCase() === employee.id.toLowerCase()
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {emp.fullName}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};