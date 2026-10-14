import React, { useState, useEffect } from 'react';
import { X, User, Building, Mail, Briefcase, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Employee } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeToEdit,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeToEdit) {
      setEmployeeId(employeeToEdit.id || '');
      setFullName(employeeToEdit.fullName || '');
      setDepartment(employeeToEdit.department || '');
      setTitle(employeeToEdit.title || '');
      setEmail(employeeToEdit.email || '');
      setPhotoUrl(employeeToEdit.photoUrl || '');
    } else {
      setEmployeeId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
      setFullName('');
      setDepartment('Software Engineering');
      setTitle('Staff Specialist');
      setEmail('');
      setPhotoUrl('');
    }
    setError(null);
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please enter a valid Employee ID.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter the employee full name.');
      return;
    }
    if (!department.trim()) {
      setError('Please select or specify a department.');
      return;
    }

    onSave({
      id: employeeId.trim(),
      fullName: fullName.trim(),
      department: department.trim(),
      title: title.trim() || 'Workplace Specialist',
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@workplace.co`,
      photoUrl: photoUrl.trim(),
      joinedDate: employeeToEdit ? employeeToEdit.joinedDate : new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  const previewPhotoSrc = formatGoogleDriveUrl(photoUrl) || getFallbackAvatarUrl(fullName || 'Employee');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-slate-800 my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {employeeToEdit ? `Edit Staff Member (${employeeToEdit.id})` : 'Register New Employee'}
            </h2>
            <p className="text-xs text-slate-500">Manage employee profile details & QR badge ID</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee ID - Now fully editable */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-101"
                className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono shadow-sm"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Workplace & Facilities"
                className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Email Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.rivera@workplace.co"
                className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
              />
            </div>

            {/* Google Drive Profile Picture Link */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Google Drive Profile Picture Link
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste Google Drive photo link or image URL"
                  className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 pl-10 pr-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
                />
              </div>
            </div>

            {/* Live Profile Picture Preview */}
            <div className="sm:col-span-2 bg-white/50 border border-white/80 rounded-2xl p-3 flex items-center gap-4 shadow-sm">
              <img
                src={previewPhotoSrc}
                alt="Profile Preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getFallbackAvatarUrl(fullName || 'User');
                }}
                className="w-14 h-14 rounded-full object-cover bg-white border border-white/80 shrink-0 shadow-sm"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800">Profile Photo Preview</p>
                <p className="text-slate-500 text-[11px] mt-0.5 break-all line-clamp-2">
                  {photoUrl ? `Formatted: ${previewPhotoSrc}` : 'Default avatar generated.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-white/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/60 hover:bg-white/80 text-slate-700 text-xs font-semibold rounded-full border border-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200 transition-all"
            >
              {employeeToEdit ? 'Save Employee' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};