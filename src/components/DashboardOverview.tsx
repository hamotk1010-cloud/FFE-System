import React from 'react';
import {
  Box,
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  ScanLine,
  Plus,
  ArrowUpRight,
  Building2,
  Armchair,
  Tv,
  Lamp,
  ShieldAlert,
  FileDown
} from 'lucide-react';
import { Employee, FFEAsset } from '../types';
import { formatCurrency, formatGoogleDriveUrl, getFallbackAvatarUrl, getFallbackAssetImageUrl } from '../lib/driveUtils';
import { exportAssetsToPdf, exportEmployeesToPdf } from '../lib/pdfExport';

interface DashboardOverviewProps {
  assets: FFEAsset[];
  employees: Employee[];
  onNavigateTab: (tab: 'assets' | 'employees') => void;
  onOpenAddAsset: () => void;
  onOpenAddEmployee: () => void;
  onOpenScanner: () => void;
  onViewEmployeeProfile: (empId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  assets,
  employees,
  onNavigateTab,
  onOpenAddAsset,
  onOpenAddEmployee,
  onOpenScanner,
  onViewEmployeeProfile,
}) => {
  const totalAssets = assets.length;
  const assignedAssets = assets.filter((a) => a.status === 'Assigned').length;
  const availableAssets = assets.filter((a) => a.status === 'Available').length;
  const maintenanceAssets = assets.filter((a) => a.status === 'Maintenance').length;
  const totalValue = assets.reduce((acc, a) => acc + (a.purchaseCost || 0), 0);

  const furnitureCount = assets.filter((a) => a.category === 'Furniture').length;
  const fixtureCount = assets.filter((a) => a.category === 'Fixture').length;
  const equipmentCount = assets.filter((a) => a.category === 'Equipment').length;

  const utilizationRate = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-indigo-950/90 text-white rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl border border-white/20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold rounded-full mb-3">
            <Building2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>FFE Workplace Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workplace Asset & Inventory Management
          </h1>
          <p className="text-indigo-200/90 text-sm mt-2 leading-relaxed">
            Monitor office furniture, IT fixtures, equipment deployment, and employee assignments with integrated QR badge verification.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddAsset}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Asset</span>
            </button>
            <button
              onClick={onOpenAddEmployee}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md text-xs font-semibold rounded-full flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Register Employee</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scan QR Badge</span>
            </button>

            <div className="h-6 w-px bg-white/20 hidden sm:block mx-1" />

            <button
              onClick={() => exportAssetsToPdf(assets, employees)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md text-xs font-semibold rounded-full flex items-center gap-2 transition-all"
              title="Export all FFE Assets to PDF"
            >
              <FileDown className="w-4 h-4 text-indigo-300" />
              <span>Export FFE (PDF)</span>
            </button>

            <button
              onClick={() => exportEmployeesToPdf(employees, assets)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md text-xs font-semibold rounded-full flex items-center gap-2 transition-all"
              title="Export Staff Directory to PDF"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              <span>Export Staff (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Assets */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm hover:bg-white/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Total FFE</span>
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl group-hover:bg-indigo-200 transition-colors">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-800">{totalAssets}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Valued at</span>
              <span className="font-bold text-slate-700">{formatCurrency(totalValue)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Assigned Assets */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm hover:bg-white/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Assigned</span>
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl group-hover:bg-indigo-200 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-indigo-600">{assignedAssets}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${utilizationRate}%` }} />
              </div>
              <span className="text-xs font-bold text-indigo-700 shrink-0">{utilizationRate}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Available Assets */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm hover:bg-white/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Available</span>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl group-hover:bg-emerald-200 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600">{availableAssets}</div>
            <p className="text-xs text-slate-500 mt-1">In storage or unassigned status</p>
          </div>
        </div>

        {/* Card 4: Active Staff & Maintenance */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm hover:bg-white/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Employees</span>
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl group-hover:bg-purple-200 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-800">{employees.length}</div>
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-semibold">
              <Wrench className="w-3.5 h-3.5" />
              <span>{maintenanceAssets} item(s) in repair</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
              <Armchair className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Furniture</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{furnitureCount} items</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Chairs, Desks, Tables</span>
        </div>

        <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <Lamp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fixtures</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{fixtureCount} items</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Mounts, Purifiers, Lamps</span>
        </div>

        <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Equipment</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{equipmentCount} items</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Monitors, Boards, Tech</span>
        </div>
      </div>

      {/* Master Inventory Quick View & Employee Directory Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Assigned Assets Preview (2 Cols) */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/20 bg-white/20 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Master Inventory Quick View</h2>
              <p className="text-xs text-slate-500">Recently updated assets & active custodians</p>
            </div>
            <button
              onClick={() => onNavigateTab('assets')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors"
            >
              <span>View All ({assets.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/30 sticky top-0 backdrop-blur-md border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Asset</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Category</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Location</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Assigned To</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {assets.slice(0, 5).map((asset) => {
                  const assignedEmp = asset.status === 'Assigned' && asset.assignedToEmployeeId
                    ? employees.find((e) => e.id === asset.assignedToEmployeeId)
                    : null;
                  const imageSrc = formatGoogleDriveUrl(asset.photoUrl) || getFallbackAssetImageUrl(asset.category);

                  return (
                    <tr key={asset.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageSrc}
                            alt={asset.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(asset.category);
                            }}
                            className="w-10 h-10 rounded-xl object-cover bg-white/80 border border-white/60 shrink-0 shadow-sm"
                          />
                          <div>
                            <p className="font-medium text-slate-900 truncate max-w-[160px]">{asset.name}</p>
                            <p className="font-mono text-xs text-slate-400">
                              <span>{asset.id}</span>
                              {asset.tagNumber && (
                                <span className="ml-1.5 text-[10px] text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded">
                                  {asset.tagNumber}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {asset.category}
                      </td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[140px]">
                        {asset.location}
                      </td>
                      <td className="px-6 py-4">
                        {assignedEmp ? (
                          <button
                            onClick={() => onViewEmployeeProfile(assignedEmp.id)}
                            className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-semibold transition-colors"
                          >
                            <img
                              src={formatGoogleDriveUrl(assignedEmp.photoUrl) || getFallbackAvatarUrl(assignedEmp.fullName)}
                              alt={assignedEmp.fullName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getFallbackAvatarUrl(assignedEmp.fullName);
                              }}
                              className="w-6 h-6 rounded-full object-cover shrink-0 shadow-sm"
                            />
                            <span className="truncate max-w-[120px]">{assignedEmp.fullName}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            asset.status === 'Assigned'
                              ? 'bg-indigo-100 text-indigo-700'
                              : asset.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Directory Quick List (1 Col) */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Staff Directory</h2>
                <p className="text-xs text-slate-500">QR badges & assigned assets</p>
              </div>
              <button
                onClick={() => onNavigateTab('employees')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                All ({employees.length})
              </button>
            </div>

            <div className="space-y-3">
              {employees.slice(0, 4).map((emp) => {
                const empAssetCount = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id).length;
                const photoSrc = formatGoogleDriveUrl(emp.photoUrl) || getFallbackAvatarUrl(emp.fullName);

                return (
                  <div
                    key={emp.id}
                    onClick={() => onViewEmployeeProfile(emp.id)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/60 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={photoSrc}
                        alt={emp.fullName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackAvatarUrl(emp.fullName);
                        }}
                        className="w-10 h-10 rounded-full object-cover bg-white border border-white/80 shadow-sm"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{emp.fullName}</p>
                        <p className="text-[11px] text-slate-500">{emp.department}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200/50">
                        {empAssetCount} FFE
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/30">
            <button
              onClick={onOpenScanner}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
            >
              <ScanLine className="w-4 h-4" />
              <span>Launch Camera QR Scanner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
