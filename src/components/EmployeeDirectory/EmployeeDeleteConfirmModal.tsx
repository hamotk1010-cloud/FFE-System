import React from 'react';
import { AlertTriangle, Trash2, X, Box } from 'lucide-react';
import { Employee, FFEAsset } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';

interface EmployeeDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  assignedAssetsCount: number;
}

export const EmployeeDeleteConfirmModal: React.FC<EmployeeDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employee,
  assignedAssetsCount,
}) => {
  if (!isOpen || !employee) return null;

  const photoSrc = formatGoogleDriveUrl(employee.photoUrl) || getFallbackAvatarUrl(employee.fullName);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Delete Employee Record?</h2>
            <p className="text-xs text-rose-600 font-bold">Confirmation required</p>
          </div>
        </div>

        {/* Employee Brief Card */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-4 mb-4 flex items-center gap-3.5 shadow-sm">
          <img
            src={photoSrc}
            alt={employee.fullName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getFallbackAvatarUrl(employee.fullName);
            }}
            className="w-12 h-12 rounded-full object-cover bg-white border border-white/80 shrink-0 shadow-sm"
          />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{employee.fullName}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {employee.id} • {employee.department}
            </p>
          </div>
        </div>

        {/* Warning Text Requirement */}
        <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl mb-6 space-y-2 shadow-xs">
          <p className="text-sm font-bold text-rose-800">
            Are you sure you want to delete this employee? This action cannot be undone.
          </p>
          {assignedAssetsCount > 0 ? (
            <div className="text-xs text-rose-700 flex items-start gap-2 pt-1 font-medium">
              <Box className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>
                <strong>Asset Warning:</strong> {employee.fullName} currently has <strong>{assignedAssetsCount} FFE asset(s)</strong> assigned. Deleting this employee will automatically unassign those items and return them to <strong>Available</strong> status.
              </span>
            </div>
          ) : (
            <p className="text-xs text-rose-600 font-medium">
              The employee record and their scannable QR badge ID will be permanently removed.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/60 hover:bg-white/80 text-slate-700 text-xs font-semibold rounded-full border border-white/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-rose-200 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
