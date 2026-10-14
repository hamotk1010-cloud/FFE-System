import React, { useState, useEffect } from 'react';
import {
  X,
  Box,
  Layers,
  Plus,
  Trash2,
  Tag,
  Barcode,
  Link as LinkIcon,
  AlertCircle,
  Check,
  FileSpreadsheet,
  Sparkles,
  Calculator,
  Hash,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AssetCategory, AssetStatus, Employee, FFEAsset } from '../../types';
import { formatCurrency, formatGoogleDriveUrl, getFallbackAssetImageUrl } from '../../lib/driveUtils';

interface GroupUnitEntry {
  id: string;
  tagNumber: string;
  serialNumber: string;
  customSuffix?: string;
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: Partial<FFEAsset> | Partial<FFEAsset>[]) => void;
  assetToEdit?: FFEAsset | null;
  employees: Employee[];
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetToEdit,
  employees,
}) => {
  // Mode: Single item vs Group of items
  const [modalMode, setModalMode] = useState<'single' | 'group'>('single');

  // Common shared fields
  const [name, setName] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Furniture');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState<AssetStatus>('Available');
  const [location, setLocation] = useState('');
  const [assignedToEmployeeId, setAssignedToEmployeeId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Group of Items State
  const [groupUnits, setGroupUnits] = useState<GroupUnitEntry[]>([
    { id: '1', tagNumber: '', serialNumber: '', customSuffix: '' },
    { id: '2', tagNumber: '', serialNumber: '', customSuffix: '' },
    { id: '3', tagNumber: '', serialNumber: '', customSuffix: '' },
  ]);
  const [showAutoFillTools, setShowAutoFillTools] = useState(false);
  const [tagPrefix, setTagPrefix] = useState('TAG-');
  const [tagStartNumber, setTagStartNumber] = useState('101');
  const [serialPrefix, setSerialPrefix] = useState('SN-');
  const [serialStartNumber, setSerialStartNumber] = useState('1001');

  // Quick Paste from Clipboard / Spreadsheet
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkPasteMode, setBulkPasteMode] = useState<'both' | 'tags_only' | 'serials_only'>('both');

  useEffect(() => {
    if (assetToEdit) {
      setModalMode('single');
      setName(assetToEdit.name || '');
      setTagNumber(assetToEdit.tagNumber || '');
      setCategory(assetToEdit.category || 'Furniture');
      setSerialNumber(assetToEdit.serialNumber || '');
      setStatus(assetToEdit.status || 'Available');
      setLocation(assetToEdit.location || '');
      setAssignedToEmployeeId(assetToEdit.assignedToEmployeeId || '');
      setPhotoUrl(assetToEdit.photoUrl || '');
      setPurchaseCost(assetToEdit.purchaseCost ? String(assetToEdit.purchaseCost) : '');
      setNotes(assetToEdit.notes || '');
    } else {
      setName('');
      setTagNumber('');
      setCategory('Furniture');
      setSerialNumber('');
      setStatus('Available');
      setLocation('');
      setAssignedToEmployeeId('');
      setPhotoUrl('');
      setPurchaseCost('');
      setNotes('');
      setGroupUnits([
        { id: '1', tagNumber: '', serialNumber: '', customSuffix: '' },
        { id: '2', tagNumber: '', serialNumber: '', customSuffix: '' },
        { id: '3', tagNumber: '', serialNumber: '', customSuffix: '' },
      ]);
    }
    setError(null);
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto handle status change when assigned employee is selected
  const handleEmployeeChange = (empId: string) => {
    setAssignedToEmployeeId(empId);
    if (empId) {
      setStatus('Assigned');
    } else if (status === 'Assigned') {
      setStatus('Available');
    }
  };

  const handleStatusChange = (newStatus: AssetStatus) => {
    setStatus(newStatus);
    if (newStatus !== 'Assigned') {
      setAssignedToEmployeeId('');
    }
  };

  // Group Units Handlers
  const handleAddUnit = () => {
    const nextId = (groupUnits.length + 1).toString();
    setGroupUnits((prev) => [
      ...prev,
      { id: nextId, tagNumber: '', serialNumber: '', customSuffix: '' },
    ]);
  };

  const handleSetUnitCount = (count: number) => {
    if (count < 1) return;
    setGroupUnits((prev) => {
      if (count > prev.length) {
        const added: GroupUnitEntry[] = [];
        for (let i = prev.length + 1; i <= count; i++) {
          added.push({ id: i.toString(), tagNumber: '', serialNumber: '', customSuffix: '' });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  const handleRemoveUnit = (index: number) => {
    if (groupUnits.length <= 1) return;
    setGroupUnits((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateUnit = (index: number, field: keyof GroupUnitEntry, value: string) => {
    setGroupUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Auto-fill sequences for Tags and Serials
  const handleAutoFillTags = () => {
    const start = parseInt(tagStartNumber, 10) || 1;
    setGroupUnits((prev) =>
      prev.map((unit, idx) => ({
        ...unit,
        tagNumber: `${tagPrefix}${(start + idx).toString().padStart(3, '0')}`,
      }))
    );
  };

  const handleAutoFillSerials = () => {
    const start = parseInt(serialStartNumber, 10) || 1;
    setGroupUnits((prev) =>
      prev.map((unit, idx) => ({
        ...unit,
        serialNumber: `${serialPrefix}${(start + idx).toString().padStart(4, '0')}`,
      }))
    );
  };

  // Process Bulk Pasted Content (e.g. from Excel or Google Sheets)
  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) {
      setShowBulkPasteModal(false);
      return;
    }

    const lines = bulkPasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setShowBulkPasteModal(false);
      return;
    }

    const newUnits: GroupUnitEntry[] = [];

    lines.forEach((line, index) => {
      // Check if line contains tab, comma, or pipe separator (e.g. "TAG-001\tSN-999" or "TAG-001,SN-999")
      const parts = line.split(/[\t,|]+/).map((p) => p.trim());

      let tag = '';
      let serial = '';

      if (bulkPasteMode === 'tags_only') {
        tag = parts[0] || '';
        serial = groupUnits[index]?.serialNumber || '';
      } else if (bulkPasteMode === 'serials_only') {
        serial = parts[0] || '';
        tag = groupUnits[index]?.tagNumber || '';
      } else {
        // Both: part 1 = tag, part 2 = serial (or if single value, assign to serial)
        if (parts.length >= 2) {
          tag = parts[0];
          serial = parts[1];
        } else {
          // If starts with TAG or similar, put in tag, otherwise serial
          if (/^TAG|^FFE/i.test(parts[0])) {
            tag = parts[0];
          } else {
            serial = parts[0];
          }
        }
      }

      newUnits.push({
        id: (index + 1).toString(),
        tagNumber: tag,
        serialNumber: serial,
        customSuffix: '',
      });
    });

    setGroupUnits(newUnits);
    setShowBulkPasteModal(false);
    setBulkPasteText('');
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the asset item name.');
      return;
    }
    if (!location.trim()) {
      setError('Please specify the workplace location.');
      return;
    }

    const finalAssignedEmpId = status === 'Assigned' && assignedToEmployeeId ? assignedToEmployeeId : null;
    const finalStatus: AssetStatus = finalAssignedEmpId
      ? 'Assigned'
      : status === 'Assigned'
      ? 'Available'
      : status;

    const unitCost = purchaseCost ? parseFloat(purchaseCost) : 0;

    // SINGLE ITEM MODE
    if (modalMode === 'single' || assetToEdit) {
      onSave({
        id: assetToEdit ? assetToEdit.id : undefined,
        name: name.trim(),
        tagNumber: tagNumber.trim() || undefined,
        category,
        serialNumber: serialNumber.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        status: finalStatus,
        location: location.trim(),
        assignedToEmployeeId: finalAssignedEmpId,
        photoUrl: photoUrl.trim(),
        purchaseCost: unitCost,
        notes: notes.trim(),
      });
    } else {
      // GROUP / BATCH MODE
      if (groupUnits.length === 0) {
        setError('Please add at least one unit to this group.');
        return;
      }

      const batchData: Partial<FFEAsset>[] = groupUnits.map((unit, index) => {
        const itemTag = unit.tagNumber.trim() || undefined;
        const itemSerial = unit.serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}-${index + 1}`;
        const itemName = unit.customSuffix?.trim()
          ? `${name.trim()} (${unit.customSuffix.trim()})`
          : groupUnits.length > 1
          ? `${name.trim()} #${index + 1}`
          : name.trim();

        return {
          name: itemName,
          tagNumber: itemTag,
          category,
          serialNumber: itemSerial,
          status: finalStatus,
          location: location.trim(),
          assignedToEmployeeId: finalAssignedEmpId,
          photoUrl: photoUrl.trim(),
          purchaseCost: unitCost,
          notes: notes.trim()
            ? `${notes.trim()}${unit.customSuffix ? ` [${unit.customSuffix}]` : ''}`
            : unit.customSuffix || '',
        };
      });

      onSave(batchData);
    }

    onClose();
  };

  const previewFormattedUrl = formatGoogleDriveUrl(photoUrl) || getFallbackAssetImageUrl(category);
  const totalGroupValue = (purchaseCost ? parseFloat(purchaseCost) : 0) * (modalMode === 'group' ? groupUnits.length : 1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl relative text-slate-800 my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shrink-0">
            {modalMode === 'group' ? <Layers className="w-6 h-6" /> : <Box className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {assetToEdit
                ? `Edit FFE Asset (${assetToEdit.id})`
                : modalMode === 'group'
                ? 'Add Group of FFE Items (Batch)'
                : 'Add New FFE Asset'}
            </h2>
            <p className="text-xs text-slate-500">
              {assetToEdit
                ? 'Update asset specifications and assignment'
                : modalMode === 'group'
                ? 'Add multiple units sharing common specifications with manual tag numbers and serial numbers'
                : 'Record single workplace furniture, fixture, or technical equipment'}
            </p>
          </div>
        </div>

        {/* Mode Selector (Only when creating new asset) */}
        {!assetToEdit && (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl mb-5 shrink-0 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setModalMode('single')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                modalMode === 'single'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Single Item</span>
            </button>
            <button
              type="button"
              onClick={() => setModalMode('group')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                modalMode === 'group'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Add Group of Items (Batch)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${modalMode === 'group' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                {groupUnits.length} Units
              </span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-medium shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* SECTION 1: Common Specifications */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-indigo-600" />
                <span>{modalMode === 'group' ? 'Group Common Specifications' : 'Asset Information'}</span>
              </h3>
              {modalMode === 'group' && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Shared across all units in this group
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Item Base Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalMode === 'group' ? 'Base Item / Model Name' : 'Asset Item Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={modalMode === 'group' ? 'e.g. Ergonomic Office Mesh Chair or Dell 27 4K Monitor' : 'e.g. Herman Miller Aeron Chair'}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
                />
              </div>

              {/* Tag & Serial (Only in Single Mode) */}
              {modalMode === 'single' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Asset Tag Number</span>
                    </label>
                    <input
                      type="text"
                      value={tagNumber}
                      onChange={(e) => setTagNumber(e.target.value)}
                      placeholder="e.g. TAG-2024-001"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Serial Number</span>
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. SN-HM-88291"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono shadow-sm"
                    />
                  </div>
                </>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssetCategory)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm"
                >
                  <option value="Furniture">Furniture (Chairs, Desks, Tables)</option>
                  <option value="Fixture">Fixture (Mounts, Air Purifiers, Lighting)</option>
                  <option value="Equipment">Equipment (Monitors, AV, Hardware)</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Workplace Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Building A - Level 3 - Room 302"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
                />
              </div>

              {/* Purchase Cost */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalMode === 'group' ? 'Purchase Cost per Unit (₱)' : 'Purchase Cost (₱)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  placeholder="e.g. 15000.00"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as AssetStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm"
                >
                  <option value="Available">Available (In Stock / Unassigned)</option>
                  <option value="Assigned">Assigned to Employee</option>
                  <option value="Maintenance">In Maintenance / Repair</option>
                  <option value="Retired">Retired / Decommissioned</option>
                </select>
              </div>

              {/* Assigned Employee */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalMode === 'group' ? 'Assign All to Employee (Optional)' : 'Assigned Employee'}
                </label>
                <select
                  value={assignedToEmployeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm"
                >
                  <option value="">-- No Employee Assigned (Available) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.id} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Drive Photo Link / Image URL
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Paste Google Drive shared image link or direct photo URL"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="sm:col-span-2 bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3.5 shadow-sm">
                <img
                  src={previewFormattedUrl}
                  alt="Asset Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(category);
                  }}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0 shadow-sm"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Preview Asset Image</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                    {photoUrl ? `Drive Link converted automatically.` : 'Default category placeholder loaded.'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Common Notes / Specifications</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Warranty period, supplier info, specifications"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: GROUP OF ITEMS MANUAL TAGS & SERIALS TABLE */}
          {modalMode === 'group' && !assetToEdit && (
            <div className="bg-slate-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Group Units Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Item Group Units & Manual Identifiers</span>
                    </h3>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-extrabold">
                      {groupUnits.length} Items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manually enter the unique Asset Tag Number and Serial Number for each unit in this group.
                  </p>
                </div>

                {/* Quick Quantity Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Count:</span>
                  {[2, 3, 5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSetUnitCount(cnt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        groupUnits.length === cnt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-fill & Bulk Paste Tools Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => setShowAutoFillTools(!showAutoFillTools)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-200/60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showAutoFillTools ? 'Hide Auto-Fill Tools' : 'Auto-Fill Helpers / Prefix'}</span>
                  {showAutoFillTools ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkPasteModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
                  title="Paste a list of serials and tag numbers directly from Excel or Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bulk Paste from Excel / Sheets</span>
                </button>
              </div>

              {/* Expandable Auto-fill helper drawer */}
              {showAutoFillTools && (
                <div className="p-3.5 bg-white border border-indigo-100 rounded-xl space-y-3 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Tag sequence */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Tag Prefix</label>
                        <input
                          type="text"
                          value={tagPrefix}
                          onChange={(e) => setTagPrefix(e.target.value)}
                          placeholder="e.g. TAG-2026-"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono text-slate-900"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Start #</label>
                        <input
                          type="number"
                          value={tagStartNumber}
                          onChange={(e) => setTagStartNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoFillTags}
                        className="self-end px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
                      >
                        Fill Tags
                      </button>
                    </div>

                    {/* Serial sequence */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Serial Prefix</label>
                        <input
                          type="text"
                          value={serialPrefix}
                          onChange={(e) => setSerialPrefix(e.target.value)}
                          placeholder="e.g. SN-DELL-"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono text-slate-900"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Start #</label>
                        <input
                          type="number"
                          value={serialStartNumber}
                          onChange={(e) => setSerialStartNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoFillSerials}
                        className="self-end px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
                      >
                        Fill Serials
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Note: Auto-fill populates the rows below. You can still manually edit each item's tag number or serial number directly in its input field.
                  </p>
                </div>
              )}

              {/* Dynamic Table of Units */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {groupUnits.map((unit, index) => (
                  <div
                    key={unit.id}
                    className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-indigo-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    {/* Unit Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center font-mono">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 sm:hidden">
                        Unit {index + 1}
                      </span>
                    </div>

                    {/* Tag Number Input */}
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">
                        Asset Tag Number
                      </label>
                      <div className="relative">
                        <Tag className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={unit.tagNumber}
                          onChange={(e) => handleUpdateUnit(index, 'tagNumber', e.target.value)}
                          placeholder={`Tag (e.g. TAG-${(101 + index).toString().padStart(3, '0')})`}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-2.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Serial Number Input */}
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">
                        Serial Number
                      </label>
                      <div className="relative">
                        <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={unit.serialNumber}
                          onChange={(e) => handleUpdateUnit(index, 'serialNumber', e.target.value)}
                          placeholder={`Serial (e.g. SN-8829-${index + 1})`}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Custom label/suffix (Optional) */}
                    <div className="w-full sm:w-36">
                      <input
                        type="text"
                        value={unit.customSuffix || ''}
                        onChange={(e) => handleUpdateUnit(index, 'customSuffix', e.target.value)}
                        placeholder="Label / Suffix"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Optional unit label suffix"
                      />
                    </div>

                    {/* Delete Unit Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(index)}
                      disabled={groupUnits.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 shrink-0 self-end sm:self-auto"
                      title="Remove this unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Another Unit Button */}
              <button
                type="button"
                onClick={handleAddUnit}
                className="w-full py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item Unit to Group</span>
              </button>

              {/* Group Valuation Summary Bar */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-700">Group Summary:</span>
                  <span className="font-extrabold text-indigo-900">{groupUnits.length} Total Units</span>
                </div>
                <div className="font-bold text-slate-700">
                  Total Valuation: <span className="text-indigo-700 font-extrabold">{formatCurrency(totalGroupValue)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              {modalMode === 'group'
                ? `Ready to create ${groupUnits.length} FFE items`
                : '1 FFE item will be recorded'}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
              >
                {modalMode === 'group' ? (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Create {groupUnits.length} FFE Items</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{assetToEdit ? 'Save Changes' : 'Add Asset'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bulk Paste Modal Helper */}
      {showBulkPasteModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Bulk Paste Serials / Asset Tags</h3>
                  <p className="text-[11px] text-slate-500">Copy lines from Excel, Sheets, or text</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selection for paste */}
            <div className="flex items-center gap-2 text-xs">
              <label className="font-bold text-slate-700">Paste Format:</label>
              <select
                value={bulkPasteMode}
                onChange={(e) => setBulkPasteMode(e.target.value as any)}
                className="bg-slate-100 border border-slate-200 rounded-lg py-1 px-2.5 font-semibold text-slate-800"
              >
                <option value="both">Both (Tag & Serial columns / Separated by Tab or Comma)</option>
                <option value="serials_only">Serial Numbers Only (1 per line)</option>
                <option value="tags_only">Asset Tag Numbers Only (1 per line)</option>
              </select>
            </div>

            <textarea
              rows={6}
              value={bulkPasteText}
              onChange={(e) => setBulkPasteText(e.target.value)}
              placeholder={`Example:\nTAG-001\tSN-DELL-8891\nTAG-002\tSN-DELL-8892\nTAG-003\tSN-DELL-8893`}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPaste}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-md shadow-emerald-200 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Populate Table</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
