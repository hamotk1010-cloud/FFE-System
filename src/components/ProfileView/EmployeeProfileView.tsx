import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Box,
  QrCode,
  Plus,
  UserX,
  ExternalLink,
  Tag,
  MapPin,
  Barcode,
  Armchair,
  Tv,
  Lamp,
  CheckCircle2,
  Calendar,
  FileDown
} from 'lucide-react';
import { Employee, FFEAsset } from '../../types';
import { formatCurrency, formatGoogleDriveUrl, getFallbackAssetImageUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';
import { exportEmployeeCustodySlipToPdf } from '../../lib/pdfExport';

interface EmployeeProfileViewProps {
  employee: Employee;
  assignedAssets: FFEAsset[];
  allAssets: FFEAsset[];
  onBackToDirectory: () => void;
  onUnassignAsset: (asset: FFEAsset) => void;
  onAssignAssetToEmployee: (assetId: string, employeeId: string) => void;
  onShowQRModal: (emp: Employee) => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employee,
  assignedAssets,
  allAssets,
  onBackToDirectory,
  onUnassignAsset,
  onAssignAssetToEmployee,
  onShowQRModal,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssetToAssign, setSelectedAssetToAssign] = useState<string>('');

  // Strictly filter items currently assigned to this employee with Assigned status
  const strictlyAssigned = assignedAssets.filter(
    (a) => a.status === 'Assigned' && a.assignedToEmployeeId === employee.id
  );

  // Available unassigned assets
  const availableAssets = allAssets.filter(
    (a) => a.status === 'Available' || (!a.assignedToEmployeeId && a.status !== 'Maintenance' && a.status !== 'Retired')
  );

  const photoSrc = formatGoogleDriveUrl(employee.photoUrl) || getFallbackAvatarUrl(employee.fullName);

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetToAssign) return;
    onAssignAssetToEmployee(selectedAssetToAssign, employee.id);
    setSelectedAssetToAssign('');
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBackToDirectory}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 text-slate-700 hover:text-slate-900 rounded-full text-xs font-semibold border border-white/80 transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Staff Directory</span>
      </button>

      {/* Main Employee Profile Card */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={photoSrc}
              alt={employee.fullName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getFallbackAvatarUrl(employee.fullName);
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover bg-white border-2 border-white/80 shadow-md shrink-0"
            />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-700">
                  {employee.id}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {employee.department}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{employee.fullName}</h1>
              <p className="text-sm font-semibold text-slate-600">{employee.title}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined {employee.joinedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Action Widget */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 w-full md:w-auto bg-white/50 p-4 rounded-2xl border border-white/80 shrink-0 text-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Fixed QR Badge</p>
                <p className="text-[11px] text-slate-500 font-medium">Permanent QR with Live Asset Sync</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full">
              <button
                onClick={() => onShowQRModal(employee)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>View / Download Badge</span>
              </button>

              <button
                onClick={() => exportEmployeeCustodySlipToPdf(employee, strictlyAssigned)}
                className="w-full py-2 px-4 bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/80 font-semibold text-xs rounded-full shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download Custody Slip (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Table Header for Assigned FFE Assets */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/30">
          <div>
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Assigned FFE Workplace Assets</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {strictlyAssigned.length} Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipment, furniture, and fixtures currently assigned to {employee.fullName}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => exportEmployeeCustodySlipToPdf(employee, strictlyAssigned)}
              className="px-4 py-2.5 bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/80 text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
              title="Download official PDF custody form"
            >
              <FileDown className="w-4 h-4 text-indigo-600" />
              <span>Export Custody Slip (PDF)</span>
            </button>

            <button
              onClick={() => setShowAssignModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Asset</span>
            </button>
          </div>
        </div>

        {/* Assigned Assets Sub-Table */}
        {strictlyAssigned.length === 0 ? (
          <div className="p-8 text-center bg-white/50 rounded-2xl border border-white/80 text-slate-500 space-y-2 shadow-sm">
            <Box className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800">No FFE items currently assigned to this employee</p>
            <p className="text-xs text-slate-500">Click "Assign New Asset" above to issue furniture or equipment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/40 text-slate-500 text-[10px] uppercase font-bold border-b border-white/20">
                <tr>
                  <th className="py-3.5 px-4">Asset Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Serial Number</th>
                  <th className="py-3.5 px-4">Workplace Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {strictlyAssigned.map((asset) => {
                  const imageSrc = formatGoogleDriveUrl(asset.photoUrl) || getFallbackAssetImageUrl(asset.category);

                  return (
                    <tr key={asset.id} className="hover:bg-white/50 transition-colors">
                      {/* Asset Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageSrc}
                            alt={asset.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(asset.category);
                            }}
                            className="w-11 h-11 rounded-xl object-cover bg-white border border-white/80 shrink-0 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-bold text-indigo-600">{asset.id}</span>
                              {asset.tagNumber && (
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                  <Tag className="w-2.5 h-2.5 text-indigo-500" />
                                  {asset.tagNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-white/60 text-slate-700 border border-white/80 shadow-sm">
                          {asset.category === 'Furniture' && <Armchair className="w-3 h-3 text-amber-500" />}
                          {asset.category === 'Fixture' && <Lamp className="w-3 h-3 text-sky-500" />}
                          {asset.category === 'Equipment' && <Tv className="w-3 h-3 text-indigo-500" />}
                          {asset.category}
                        </span>
                      </td>

                      {/* Serial Number */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">{asset.serialNumber}</td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{asset.location}</span>
                        </div>
                      </td>

                      {/* Unassign Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onUnassignAsset(asset)}
                          className="px-3.5 py-1.5 bg-white/60 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-white/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto shadow-sm"
                        >
                          <UserX className="w-3.5 h-3.5 text-rose-500" />
                          <span>Unassign Asset</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Asset Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/50"
            >
              <ArrowLeft className="w-5 h-5 rotate-90" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Assign FFE Item to {employee.fullName}</h3>
            <p className="text-xs text-slate-500 mb-4">Select an available unassigned asset from inventory</p>

            {availableAssets.length === 0 ? (
              <div className="p-4 bg-white/50 rounded-2xl text-center text-xs text-slate-500 font-medium border border-white/80">
                No unassigned assets currently available in inventory.
              </div>
            ) : (
              <form onSubmit={handleConfirmAssign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Available Assets</label>
                  <select
                    required
                    value={selectedAssetToAssign}
                    onChange={(e) => setSelectedAssetToAssign(e.target.value)}
                    className="w-full bg-white/60 border border-white/80 rounded-2xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm"
                  >
                    <option value="">-- Choose an Available FFE Item --</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.id} - {asset.category} - {asset.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-5 py-2.5 bg-white/60 hover:bg-white/80 text-slate-700 text-xs font-semibold rounded-full border border-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedAssetToAssign}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
